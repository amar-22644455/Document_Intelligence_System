from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Optional
import os
import shutil
import sys
import json
from uuid import uuid4
from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.rag.embedder import create_embeddings
from app.rag.rag_pipeline import RAGPipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

STORAGE_DIR = os.path.join(BASE_DIR, "storage")
UI_DIR = os.path.join(BASE_DIR, "ui")
DIST_DIR = os.path.join(UI_DIR, "dist")
DIST_ASSETS_DIR = os.path.join(DIST_DIR, "assets")
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".png", ".jpg", ".jpeg", ".bmp", ".tiff"}

_sessions: dict[str, dict[str, Any]] = {}

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    os.makedirs(STORAGE_DIR, exist_ok=True)
    print("--- Startup complete ---")
    yield
    print("--- Shutdown complete ---")

app = FastAPI(title="RAG-Based Document Intelligence System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(DIST_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=DIST_ASSETS_DIR), name="assets")


@app.get("/")
def serve_ui():
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "backend running", "message": "Run Vite build to serve UI from backend."}

class QueryPayload(BaseModel):
    session_id: str
    query: str
    target_file: Optional[str] = None
    is_chat: Optional[bool] = True

class ComparePayload(BaseModel):
    session_id: str
    query: str
    file_a: str
    file_b: str


class SessionPayload(BaseModel):
    session_id: str


def _session_paths(session_id: str) -> tuple[str, str, str]:
    session_dir = os.path.join(STORAGE_DIR, session_id)
    docs_dir = os.path.join(session_dir, "docs")
    embeddings_dir = os.path.join(session_dir, "embeddings")
    return session_dir, docs_dir, embeddings_dir


def _ensure_dirs(session_id: str) -> tuple[str, str]:
    os.makedirs(STORAGE_DIR, exist_ok=True)
    session_dir, docs_dir, embeddings_dir = _session_paths(session_id)
    os.makedirs(session_dir, exist_ok=True)
    os.makedirs(docs_dir, exist_ok=True)
    os.makedirs(embeddings_dir, exist_ok=True)
    return docs_dir, embeddings_dir


def _analysis_file(session_id: str) -> str:
    _, _, embeddings_dir = _session_paths(session_id)
    return os.path.join(embeddings_dir, "document_data.pkl")


def _list_uploaded_documents(session_id: str) -> list[str]:
    _, docs_dir, _ = _session_paths(session_id)
    if not os.path.exists(docs_dir):
        return []

    return sorted(
        file_name
        for file_name in os.listdir(docs_dir)
        if os.path.isfile(os.path.join(docs_dir, file_name))
    )


def _ensure_session(session_id: str) -> dict[str, Any]:
    if session_id in _sessions:
        return _sessions[session_id]

    session_dir, docs_dir, embeddings_dir = _session_paths(session_id)
    if os.path.exists(session_dir):
        uploaded = _list_uploaded_documents(session_id)
        session_emb_file = os.path.join(embeddings_dir, "document_data.pkl")
        analysis_ready = os.path.exists(session_emb_file)

        summaries = {}
        summaries_file = os.path.join(session_dir, "summaries.json")
        if os.path.exists(summaries_file):
            try:
                with open(summaries_file, "r", encoding="utf-8") as f:
                    summaries = json.load(f)
            except Exception:
                pass

        _sessions[session_id] = {
            "uploadedDocuments": uploaded,
            "analysis_ready": analysis_ready,
            "summaries": summaries
        }
        return _sessions[session_id]

    raise HTTPException(status_code=404, detail="Session not found")


@app.post("/api/upload")
async def upload_files(
    files: list[UploadFile] = File(...),
    session_id: Optional[str] = Form(None)
) -> dict[str, Any]:
    if session_id == "null" or session_id == "undefined" or not session_id:
        session_id = str(uuid4())

    docs_dir, embeddings_dir = _ensure_dirs(session_id)

    uploaded = []
    for upload in files:
        filename = os.path.basename(upload.filename)
        _, ext = os.path.splitext(filename)
        if ext.lower() not in ALLOWED_EXTENSIONS:
            continue
        dest = os.path.join(docs_dir, filename)
        with open(dest, "wb") as f:
            f.write(await upload.read())
        uploaded.append(filename)

    # Save to session (incremental)
    if session_id in _sessions:
        session = _sessions[session_id]
        session["uploadedDocuments"] = _list_uploaded_documents(session_id)
        session["analysis_ready"] = False
    else:
        _sessions[session_id] = {
            "uploadedDocuments": _list_uploaded_documents(session_id),
            "analysis_ready": False,
            "summaries": {}
        }

    return {
        "session_id": session_id,
        "sessionId": session_id,
        "uploadedDocuments": _sessions[session_id]["uploadedDocuments"],
        "uploaded": len(uploaded),
        "analysisReady": False,
        "analysis_ready": False
    }


@app.post("/api/analyze")
def analyze_documents(payload: SessionPayload) -> dict[str, Any]:
    session_id = payload.session_id
    session = _ensure_session(session_id)

    docs = _list_uploaded_documents(session_id)
    if not docs:
        raise HTTPException(status_code=400, detail="No documents uploaded")

    # Create embeddings for all uploaded documents in the session's docs directory
    _, docs_dir, embeddings_dir = _session_paths(session_id)
    success = create_embeddings(docs_dir, embeddings_dir)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create embeddings for uploaded documents")

    # Try to generate lightweight summaries for the UI. If the LLM or pipeline fails,
    # return success but include an empty summaries dict and note the failure.
    summaries = {}
    # Initialize the RAG pipeline AFTER embeddings are written so the Retriever
    # loads the newly created `document_data.pkl` and can find the uploaded files.
    try:
        rag = RAGPipeline(embeddings_dir=embeddings_dir)
        summaries = rag.generate_summaries(docs)
    except Exception:
        # Don't fail the whole request if the LLM isn't configured or if pipeline init fails
        summaries = {}

    session["analysis_ready"] = True
    session["summaries"] = summaries

    try:
        session_dir, _, _ = _session_paths(session_id)
        summaries_file = os.path.join(session_dir, "summaries.json")
        with open(summaries_file, "w", encoding="utf-8") as f:
            json.dump(summaries, f, indent=2)
    except Exception as e:
        print(f"Error saving summaries to disk: {e}")

    # Return both camelCase and snake_case and include session id for the UI
    return {
        "analysisReady": True,
        "analysis_ready": True,
        "session_id": session_id,
        "sessionId": session_id,
        "uploadedDocuments": docs,
        "summaries": summaries,
    }


@app.get("/api/status")
def status(session_id: str):
    try:
        session = _ensure_session(session_id)
        return {
            "sessionId": session_id,
            "session_id": session_id,
            "uploadedDocuments": session.get("uploadedDocuments", []),
            "analysisReady": bool(session.get("analysis_ready", False)),
            "analysis_ready": bool(session.get("analysis_ready", False)),
            "summaries": session.get("summaries", {}),
        }
    except HTTPException:
        raise HTTPException(status_code=404, detail="Session not found")


@app.post("/api/query")
def query(payload: QueryPayload) -> dict[str, Any]:
    session_id = payload.session_id
    session = _ensure_session(session_id)

    # Ensure there are uploaded docs
    docs = _list_uploaded_documents(session_id)
    if not docs:
        raise HTTPException(status_code=400, detail="No documents uploaded")

    try:
        _, _, embeddings_dir = _session_paths(session_id)
        rag = RAGPipeline(embeddings_dir=embeddings_dir)
    except Exception as e:
        return {"data": {"answer": {"error": str(e)}}, "answer": {"error": str(e)}, "sources": []}

    result = rag.query_document(payload.query, target_file=payload.target_file, is_chat=payload.is_chat)
    return {"data": {"answer": result.get("answer"), "sources": result.get("sources")}, "answer": result.get("answer"), "sources": result.get("sources")}


@app.post("/api/compare")
def compare(payload: ComparePayload) -> dict[str, Any]:
    session_id = payload.session_id
    session = _ensure_session(session_id)

    docs = _list_uploaded_documents(session_id)
    if not docs:
        raise HTTPException(status_code=400, detail="No documents uploaded")

    try:
        _, _, embeddings_dir = _session_paths(session_id)
        rag = RAGPipeline(embeddings_dir=embeddings_dir)
    except Exception as e:
        return {"data": {"answer": {"error": str(e)}}, "answer": {"error": str(e)}, "sources": {}}

    result = rag.compare_documents(payload.query, payload.file_a, payload.file_b)
    return {"data": {"answer": result.get("answer"), "sources": result.get("sources")}, "answer": result.get("answer"), "sources": result.get("sources")}


@app.post("/api/reset")
def reset(payload: SessionPayload) -> dict[str, Any]:
    session_id = payload.session_id

    # Remove session storage on disk if present
    session_dir, docs_dir, embeddings_dir = _session_paths(session_id)
    try:
        if os.path.exists(session_dir):
            shutil.rmtree(session_dir)
    except Exception:
        pass

    # Remove from in-memory sessions
    _sessions.pop(session_id, None)
    return {"reset": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("dashboard:app", host="127.0.0.1", port=8000, reload=True)
