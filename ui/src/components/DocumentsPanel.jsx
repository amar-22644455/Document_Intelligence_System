export default function DocumentsPanel({
  uploadedDocuments,
  selectedFiles,
  setSelectedFiles,
  uploadStatus,
  activeDocument,
  setActiveDocument,
  documentCountLabel,
  onUpload,
  onAnalyze,
  onReset,
  isUploading,
  analysisReady,
  documentSummaries
}) {
  return (
    <section className="panel left-panel">
      <div className="panel-header">
        <p className="label">Storage & Ingestion</p>
        <h1>RAG Document Intelligence</h1>
      </div>

      {/* Active Files Card - Primary focus */}
      <div className="card active-files-card">
        <div className="card-title-row">
          <p className="meta">Active Files</p>
          <span className="status-chip">{documentCountLabel}</span>
        </div>

        {/* Document List - Full width, no excessive scrollbar */}
        <div className="document-list">
          {uploadedDocuments.length === 0 ? (
            <div className="empty-state">
              <p className="empty-message">No documents uploaded yet.</p>
              <p className="empty-hint">Use the controls below to get started.</p>
            </div>
          ) : (
            uploadedDocuments.map((name, index) => (
              <button
                type="button"
                key={`${name}-${index}`}
                className={`document-item ${activeDocument === name ? 'active' : ''}`}
                onClick={() => setActiveDocument(name)}
                title={name}
              >
                <div className="doc-info">
                  <span className="doc-name">{name}</span>
                </div>
                <div className="doc-status">
                  <span className="doc-meta">
                    {documentSummaries[name] ? '✓' : '⟳'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Compact Upload Controls */}
      <div className="card upload-controls-card">
        <p className="meta">Ingestion Controls</p>

        {/* Button Row 1: Select Files + Upload */}
        <div className="button-row">
          <label className="btn btn-select">
            Select Files
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.png,.jpg,.jpeg"
              onChange={(event) => {
                const newFiles = Array.from(event.target.files || []);
                setSelectedFiles((prevFiles) => {
                  const merged = [...prevFiles];
                  newFiles.forEach((file) => {
                    const isDuplicate = merged.some(
                      (f) => f.name === file.name && f.size === file.size
                    );
                    if (!isDuplicate) {
                      merged.push(file);
                    }
                  });
                  return merged;
                });
                event.target.value = null;
              }}
              style={{ display: 'none' }}
            />
          </label>
          <button 
            className="btn btn-primary" 
            onClick={onUpload} 
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? 'Working...' : 'Upload'}
          </button>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="selected-files-preview">
            <p className="preview-label">Ready to upload:</p>
            <div className="file-list-compact">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="file-chip">
                  <span className="file-chip-name" title={file.name}>{file.name}</span>
                  <button
                    type="button"
                    className="file-chip-remove"
                    onClick={() => {
                      setSelectedFiles((prevFiles) => prevFiles.filter((_, idx) => idx !== index));
                    }}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Button Row 2: Extract Insights + Clear */}
        <div className="button-row">
          <button 
            className="btn btn-primary" 
            onClick={onAnalyze} 
            disabled={isUploading || uploadedDocuments.length === 0}
          >
            {analysisReady ? 'Re-Extract' : 'Extract Insights'}
          </button>
          <button className="btn btn-ghost" onClick={onReset}>
            Clear All
          </button>
        </div>

        {/* Status Message */}
        <div className="status-message">
          <p>{uploadStatus}</p>
        </div>
      </div>

      <style jsx>{`
        /* Active Files Card Styles */
        .active-files-card { 
          padding: 0; 
          overflow: hidden; 
          display: flex; 
          flex-direction: column; 
          flex: 1;
          min-height: 0;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--glass-border);
        }
        
        .card-title-row { 
          padding: 12px 16px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
          flex-shrink: 0;
        }
        
        /* Document list with better space management */
        .document-list { 
          flex: 1; 
          overflow-y: auto; 
          display: flex;
          flex-direction: column;
          gap: 0;
          min-height: 0;
        }
        
        .document-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .document-list::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .document-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
        }
        
        .document-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .empty-state {
          padding: 24px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }
        
        .empty-message {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        
        .empty-hint {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.3);
        }
        
        /* Document item - full width, clean rows */
        .document-item {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          border-bottom: 1px solid var(--glass-border);
          color: var(--text-main);
          transition: background-color 0.15s, color 0.15s;
          position: relative;
        }
        
        .document-item:hover { 
          background-color: rgba(255, 255, 255, 0.05); 
        }
        
        .document-item.active { 
          background-color: rgba(59, 130, 246, 0.15); 
          border-left: 3px solid #3b82f6; 
          padding-left: 13px;
          font-weight: 600;
          color: #60a5fa;
        }
        
        .doc-info { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          flex: 1; 
          min-width: 0;
        }
        
        .doc-icon { 
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        
        .doc-name { 
          font-size: 0.82rem; 
          color: inherit;
          font-weight: inherit;
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis;
          min-width: 0;
        }
        
        .doc-status {
          flex-shrink: 0;
          margin-left: 8px;
        }
        
        .doc-meta { 
          font-size: 0.75rem; 
          color: var(--text-muted);
          font-weight: normal;
        }
        
        .document-item.active .doc-meta {
          color: #60a5fa;
        }
        
        /* Compact Upload Controls */
        .upload-controls-card {
          padding: 16px;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--glass-border);
        }
        
        .meta {
          margin: 0 0 10px 0;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }
        
        /* Button rows - compact layout */
        .button-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .btn {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
          white-space: nowrap;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        
        .btn:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .btn:active:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.15);
        }
        
        .btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        
        .btn-select {
          border-color: rgba(255, 255, 255, 0.12);
        }
        
        .btn-primary {
          background: var(--primary-grad);
          color: white;
          border-color: transparent;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15);
        }
        
        .btn-primary:hover:not(:disabled) {
          background: var(--primary-grad);
          filter: brightness(1.05);
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }
        
        .btn-primary:active:not(:disabled) {
          filter: brightness(0.95);
        }
        
        .btn-ghost {
          color: var(--text-muted);
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .btn-ghost:hover:not(:disabled) {
          color: var(--text-main);
          background-color: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
        }
        
        /* Selected files preview */
        .selected-files-preview {
          margin: 8px 0;
          padding: 8px;
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: 6px;
          border: 1px solid var(--glass-border);
        }
        
        .preview-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin: 0 0 6px 0;
          font-weight: 500;
        }
        
        .file-list-compact {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .file-chip {
          font-size: 0.72rem;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .file-chip-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .file-chip-remove {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.95rem;
          line-height: 1;
          padding: 0 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s, transform 0.15s;
        }

        .file-chip-remove:hover {
          color: #f87171;
          transform: scale(1.2);
        }
        
        /* Status message */
        .status-message {
          margin-top: 8px;
          padding: 6px 8px;
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: 4px;
          border-left: 3px solid #3b82f6;
        }
        
        .status-message p {
          margin: 0;
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
      `}</style>
    </section>
  );
}