# RAG Application - Run Commands

## Available Commands

### 1. **Activate Virtual Environment**
```batch
rag_env\Scripts\activate.bat
```
**PowerShell:**
```powershell
& .\rag_env\Scripts\Activate.ps1
```

---

### 2. **Run RAG Document Intelligence Web Application (Recommended)**
```batch
python -m uvicorn dashboard:app --reload --host 127.0.0.1 --port 8000
```

**Purpose:** Launches the RAG-Based Document Intelligence dashboard
- Allows document upload (PDF, TXT, PNG, JPG, etc.)
- Provides an insights window with extracted findings and highlights
- Provides an AI chatbot for question answering and cross-document comparisons
- Web interface runs at: http://localhost:8000

**Example:**
```batch
cd d:\RAG
rag_env\Scripts\activate.bat
python -m uvicorn dashboard:app --reload --host 127.0.0.1 --port 8000
```

---

### 3. **Run CLI Application**
```batch
python main.py
```

**Purpose:** Command-line interface for the RAG system
- Creates/updates embeddings from documents in the `docs/` folder
- Provides text-based interaction with the RAG pipeline

**Example:**
```batch
cd d:\RAG
rag_env\Scripts\activate.bat
python main.py
```

---

### 4. **Alternative CLI Entry Point**
```batch
python cli.py
```

**Purpose:** Alternative command-line interface (if available)

---

### 5. **Run Vite React UI (Development)**
```batch
cd ui
npm install
npm run dev
```

**Purpose:** Runs the modular React UI with hot reload during frontend development
- Dev UI runs at: http://localhost:5173
- API calls are proxied to backend at http://localhost:8000

---

### 6. **Build Production Bundle (Vite Dist)**
```batch
cd ui
npm run build
```

**Purpose:** Builds optimized production assets in `ui/dist/`
- FastAPI automatically serves `ui/dist/index.html` and `ui/dist/assets/*` when present

---

## Step-by-Step Guide

### **Option A: Using Command Prompt (CMD)**
```batch
1. cd d:\RAG
2. rag_env\Scripts\activate.bat
3. python -m uvicorn dashboard:app --reload --host 127.0.0.1 --port 8000
```

### **Option B: Using PowerShell**
```powershell
1. cd d:\RAG
2. & .\rag_env\Scripts\Activate.ps1
3. python -m uvicorn dashboard:app --reload --host 127.0.0.1 --port 8000
```

### **Option C: Using CLI**
```batch
1. cd d:\RAG
2. rag_env\Scripts\activate.bat
3. python main.py
```

---

## Files Included

- `run_commands.bat` - Batch file with commands for CMD
- `run_commands.ps1` - PowerShell script with commands
- `COMMANDS.md` - This file with detailed documentation

---

## Notes

- The virtual environment `rag_env` should be activated before running any commands
- Open the dashboard manually at `http://localhost:8000` after starting Uvicorn
- Documents should be placed in the `docs/` folder for processing
- Embeddings are cached in the `embeddings/` folder for faster retrieval
