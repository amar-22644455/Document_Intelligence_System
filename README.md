# RAG-Based Document Intelligence System

An enterprise-grade, high-performance **Retrieval-Augmented Generation (RAG)** dashboard designed for semantic searching, key-point extraction, and deep comparative analysis of complex documents. Powered by **FastAPI**, **SentenceTransformers**, **Groq (Llama-3.1-8b-instant)**, and **Vite + React** with a premium Jade Green & Gold user interface.

---

## Key Features

*   **High-Speed Semantic Search (RAG)**: Employs `SentenceTransformers (all-MiniLM-L6-v2)` to build local dense vector indexes. Generates replies via Groq's high-speed Llama-3.1-8b pipeline.
*   **Multi-Session Directory Isolation**: Every user workspace operates inside an isolated, unique session storage directory (`/storage/<session_id>`). Uploads, vector caches, and session summaries are strictly segmented to prevent cross-tenant data leaks.
*   **Accumulative Multi-Batch Ingestion**: Upload documents incrementally. Select files in multiple batches, review the queue in real-time, remove any unwanted files with `(×)` chips, and index them in a single batch.
*   **Chronological Context Blending**: Solves "loss-in-the-middle" issues for large documents. The summarizer blends the first 3 chunks (introduction/context) with the top 12 semantic chunks, sorted in their original reading order, using a raised `9,000` character budget.
*   **Dynamic Multi-File Comparison**: Choose exactly which two documents to compare using dropdown menus. Compares content parameter-by-parameter, outputting exact structural differences, verdicts, and key insights referenced by filenames.
*   **Verifiable Citations (No Technical Clutter)**: The LLM outputs clean, human-friendly sentences, referencing simple page numbers (`[Page X]`) rather than technical chunk tags. Verifiable vector segments with exact matching percentages are listed separately in a dropdown.

---

## How it Differs from Commercial LLMs (ChatGPT, Gemini, etc.)

While generic commercial chat assistants are excellent general-purpose tools, this specialized RAG Document Intelligence System differs fundamentally in five areas:

### 1. Absolute Privacy & Session Isolation
*   **Commercial LLMs**: Standard chat assistants upload your files to public clouds where they may be logged, reviewed, or used to train public models.
*   **This System**: Uses isolated directory storage. Files are parsed, vector-indexed, and stored locally in distinct session directories, ensuring absolute containment and data governance.

### 2. Zero Hallucinations (Strict Factuality)
*   **Commercial LLMs**: Rely on parametric memory. When asked about specific corporate contracts, financial tables, or technical manuals, they often guess or hallucinate plausible-sounding answers.
*   **This System**: Constrained by strict context-grounding. The LLM is restricted *only* to retrieved vector chunks from your uploaded documents. If the fact is not in the text, it tells you, guaranteeing auditability.

### 3. Perfect Context Traceability
*   **Commercial LLMs**: Provide raw answers with no indication of *where* or *how* they found the information.
*   **This System**: Features full source attribution. Every answer is mathematically backed by dense retrieval matches. You can toggle open the sources dropdown to inspect the source filename, exact sentence chunks, page numbers, and cosine match percentages.

### 4. Specialized Comparison Logic
*   **Commercial LLMs**: Struggle to compare long documents due to context window limits, or they fail to cross-reference fine details because they prioritize the beginning and end of long prompts.
*   **This System**: Conducts parallel vector search queries across both comparison targets separately. It retrieves specific semantic nodes from each file, aligns them side-by-side, and feeds them into a comparative matrix prompt.

### 5. Sentence-Aligned Parsing
*   **Commercial LLMs**: When performing RAG, generic systems chunk documents at arbitrary character counts, cutting off ideas mid-sentence.
*   **This System**: Uses a custom `RecursiveCharacterTextSplitter` configured with period separators `". "` and larger chunk offsets (800 characters) to ensure that the context fed into the LLM consists of whole, logical sentences.

---

## Technology Stack

*   **Backend**: Python, FastAPI, PyMuPDF (`fitz`), LangChain Text Splitters, SentenceTransformers, Groq API SDK.
*   **Frontend**: React 18, Vite, Vanilla CSS (Jade & Gold theme, fluid flexbox layout).

---

## Getting Started

### 1. Environment Setup
1.  Navigate to the project root:
    ```bash
    cd d:\RAG
    ```
2.  Create a `.env` file in the root folder containing your Groq API key:
    ```env
    GROQ_API_KEY=your_groq_api_key_here
    ```

### 2. Running the Application (Unified Launcher)
We have created a unified interactive launcher script. Double-click `start_project.bat` or run it from the Command Prompt:
```bash
start_project.bat
```

This launches an interactive CLI menu:
```text
=====================================================================
RAG-Based Document Intelligence System Launcher
=====================================================================
Please select an option to run:

 [1] Start Backend Server (FastAPI on Port 8000)
 [2] Start Frontend Dev Server (Vite React on Port 5173/5174)
 [3] Compile and Build Production UI (npm run build)
 [4] Start CLI Interactive Q&A Tool (python main.py)
 [5] Run Verification Tests (test_script.py / test_query.py)
 [6] Exit
=====================================================================
```

*   Select **`1`** to run the backend API server.
*   Select **`2`** to run the frontend in development mode.
*   Select **`3`** to compile a final production bundle.
*   Select **`4`** to run a lightweight text assistant directly in your terminal.
*   Select **`5`** to run automated session isolation and query verification suites.