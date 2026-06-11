import { useState, useRef, useEffect } from 'react';

function ResponseMarkdown({ data }) {
  const summaryText = data.final_answer || data.summary || '';

  const insights = Array.isArray(data.insights) ? data.insights : [];
  const keyInsights = Array.isArray(data.key_insights) ? data.key_insights : [];
  const comparison = Array.isArray(data.comparison) ? data.comparison : [];
  const relevantSections = Array.isArray(data.relevant_sections) ? data.relevant_sections : [];

  return (
    <div className="markdown-response">
      {summaryText && (
        <div className="markdown-block">
          <div className="markdown-label">Answer</div>
          <div className="markdown-body">{summaryText}</div>
        </div>
      )}

      {!!(data.verdict || data.summary) && (
        <div className="markdown-block compact">
          {data.verdict && (
            <div className="markdown-callout verdict">
              <strong>Verdict:</strong> {data.verdict}
            </div>
          )}
          {data.summary && summaryText !== data.summary && (
            <div className="markdown-body subtle">{data.summary}</div>
          )}
        </div>
      )}

      {comparison.length > 0 && (
        <div className="markdown-block">
          <div className="markdown-label">Comparison</div>
          <div className="comparison-grid">
            {comparison.map((item, index) => (
              <div key={`${item.category || 'comparison'}-${index}`} className="comparison-card">
                <div className="comparison-title">{item.category || `Category ${index + 1}`}</div>
                <div className="comparison-row"><span>A</span><p>{item.document_a || 'Not mentioned'}</p></div>
                <div className="comparison-row"><span>B</span><p>{item.document_b || 'Not mentioned'}</p></div>
                <div className="comparison-row difference"><span>Diff</span><p>{item.difference || 'No difference provided'}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(keyInsights.length > 0 || insights.length > 0) && (
        <div className="markdown-block">
          <div className="markdown-label">Insights</div>
          <ul className="markdown-list">
            {(keyInsights.length > 0 ? keyInsights : insights).map((item, index) => (
              <li key={`${item.title || 'insight'}-${index}`}>
                <strong>{item.title || `Insight ${index + 1}`}</strong>
                {item.explanation ? <div className="markdown-body subtle">{item.explanation}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {relevantSections.length > 0 && (
        <div className="markdown-block">
          <div className="markdown-label">Relevant Sections</div>
          <ul className="markdown-list">
            {relevantSections.map((section, index) => (
              <li key={`${section.section_title || 'section'}-${index}`}>
                <strong>{section.section_title || `Section ${index + 1}`}</strong>
                {section.section_summary ? <div className="markdown-body subtle">{section.section_summary}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .markdown-response { display: grid; gap: 12px; max-width: 100%; min-width: 0; overflow: hidden; }
        .markdown-block { display: grid; gap: 8px; max-width: 100%; min-width: 0; }
        .markdown-block.compact { gap: 6px; }
        .markdown-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.75; }
        .markdown-body { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; line-height: 1.55; max-width: 100%; }
        .markdown-body.subtle { opacity: 0.92; }
        .markdown-callout { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); }
        .markdown-callout.verdict { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.24); }
        .comparison-grid { display: grid; gap: 10px; min-width: 0; }
        .comparison-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; background: rgba(255,255,255,0.04); min-width: 0; }
        .comparison-title { font-weight: 700; margin-bottom: 8px; }
        .comparison-row { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 8px; align-items: start; margin-top: 6px; }
        .comparison-row span { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #34d399; }
        .comparison-row p { margin: 0; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; min-width: 0; }
        .comparison-row.difference span { color: #fbbf24; }
        .markdown-list { margin: 0; padding-left: 18px; display: grid; gap: 10px; }
        .markdown-list li { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
      `}</style>
    </div>
  );
}

function ChatSources({ sources }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <div className="chat-sources-container">
      <button 
        type="button" 
        className="chat-sources-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide Attributed Sources' : `Show Grounded Sources (${sources.length})`}
      </button>

      {isOpen && (
        <div className="chat-sources-dropdown">
          {sources.map((src, idx) => {
            const fileName = src.source?.source || 'Document';
            const pageNum = src.source?.page;
            const score = src.score ? Math.round(src.score * 100) : null;
            return (
              <div key={`chat-src-${idx}`} className="chat-source-item">
                <div className="chat-source-meta">
                   <span className="chat-source-doc">{fileName}</span>
                  {pageNum && <span className="chat-source-page">Page {pageNum}</span>}
                  {score && <span className="chat-source-score">{score}% Match</span>}
                </div>
                <div className="chat-source-text">"{src.chunk}"</div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .chat-sources-container {
          margin-top: 6px;
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .chat-sources-toggle {
          background: none;
          border: none;
          color: #10b981;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          padding: 2px 0;
          display: inline-flex;
          align-items: center;
          transition: color 0.15s ease;
        }

        .chat-sources-toggle:hover {
          color: #34d399;
        }

        .chat-sources-dropdown {
          margin-top: 6px;
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .chat-source-item {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 6px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .chat-source-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .chat-source-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        .chat-source-doc {
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        .chat-source-page {
          background: rgba(255, 255, 255, 0.06);
          padding: 1px 4px;
          border-radius: 3px;
        }

        .chat-source-score {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          font-weight: 600;
          padding: 1px 4px;
          border-radius: 3px;
        }

        .chat-source-text {
          font-size: 0.74rem;
          color: #cbd5e1;
          line-height: 1.35;
          font-style: italic;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
      `}</style>
    </div>
  );
}

export default function ChatPanel({ 
  chatLog, 
  onSendMessage, 
  activeDocument, 
  allDocuments = [],
  queryScope = 'single',
  setQueryScope = () => {},
  isChatLoading = false
}) {
  const [message, setMessage] = useState('');
  const [isCompareMode, setIsCompareMode] = useState(false);
  
  // Selection states for comparison
  const [compareFileA, setCompareFileA] = useState('');
  const [compareFileB, setCompareFileB] = useState('');
  
  const chatBoxRef = useRef(null);

  // Safety checks
  const canCompare = allDocuments.length >= 2;
  const canQueryAll = allDocuments.length >= 1;

  // Track dropdown options
  useEffect(() => {
    if (allDocuments.length > 0) {
      if (!compareFileA || !allDocuments.includes(compareFileA)) {
        setCompareFileA(allDocuments[0]);
      }
      if (!compareFileB || !allDocuments.includes(compareFileB)) {
        setCompareFileB(allDocuments[1] || allDocuments[0]);
      }
    }
  }, [allDocuments, compareFileA, compareFileB]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatBoxRef.current) {
      const el = chatBoxRef.current;
      const atBottom = el.scrollHeight - el.clientHeight - el.scrollTop < 100;
      if (atBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [chatLog]);

  // Force compare mode off if documents count drops
  useEffect(() => {
    if (!canCompare && isCompareMode) {
      setIsCompareMode(false);
    }
  }, [canCompare, isCompareMode]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    onSendMessage(trimmed, isCompareMode, compareFileA, compareFileB);
    setMessage('');
  };

  return (
    <section className="panel right-panel">
      <div className="panel-header min-w-0">
        <div className="header-flex min-w-0">
          <div>
            <p className="label">RAG Assistant</p>
            <h2>{isCompareMode ? 'Document Comparison' : queryScope === 'all' ? 'Cross-Document Insights' : 'Document Intelligence Assistant'}</h2>
          </div>
          
          {/* Mode Toggles */}
          <div className="mode-toggles">
            {canCompare && (
              <div className="toggle-container" title={!canCompare ? "Requires 2 documents" : ""}>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={isCompareMode} 
                    onChange={() => setIsCompareMode(!isCompareMode)} 
                    disabled={!canCompare}
                  />
                  <span className={`slider round ${!canCompare ? 'disabled' : ''}`}></span>
                </label>
                <span className={`toggle-label ${!canCompare ? 'muted' : ''}`}>Compare</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Indicator */}
      <div className={`context-chip ${isCompareMode ? 'compare-active' : ''}`}>
        {isCompareMode ? (
          <div className="compare-selectors-tray">
            <span className="comp-label">Compare</span>
            <select 
              value={compareFileA} 
              onChange={(e) => setCompareFileA(e.target.value)}
              className="comp-select"
            >
              {allDocuments.map((doc, idx) => (
                <option key={`comp-sel-a-${idx}`} value={doc}>{doc}</option>
              ))}
            </select>
            <span className="comp-label">vs</span>
            <select 
              value={compareFileB} 
              onChange={(e) => setCompareFileB(e.target.value)}
              className="comp-select"
            >
              {allDocuments.map((doc, idx) => (
                <option key={`comp-sel-b-${idx}`} value={doc}>{doc}</option>
              ))}
            </select>
          </div>
        ) : (
          <span>Focus: <strong>{activeDocument || 'Select a document'}</strong></span>
        )}
      </div>

      <div className="chat-box" ref={chatBoxRef}>
        {chatLog.length === 0 && (
          <div className="empty-state">
            <p>Ask the RAG assistant a question about the document(s)...</p>
          </div>
        )}
        
        {chatLog.map((item, index) => (
          <div key={`${item.role}-${index}`} className={`chat-msg ${item.role}`}>
            <div className="msg-wrapper">
              <div className={`msg-content ${typeof item.text === 'object' ? 'structured' : 'plain'}`}>
                {typeof item.text === 'object' ? (
                  <ResponseMarkdown data={item.text} />
                ) : (
                  <div className="plain-response">
                    <div className="text-body">{item.text}</div>
                  </div>
                )}
              </div>
              {item.role === 'bot' && item.sources && item.sources.length > 0 && (
                <ChatSources sources={item.sources} />
              )}
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="chat-msg bot loading">
            <div className="msg-wrapper">
              <div className="msg-content plain">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-row tray">
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSend()}
          placeholder={isCompareMode ? "e.g., How do these differ on late fees?" : "Ask the assistant about clauses, summaries, or insights..."}
        />
        <button 
          className={`btn ${isCompareMode ? 'secondary' : 'primary'}`} 
          onClick={handleSend}
        >
          {isCompareMode ? 'Compare' : 'Ask'}
        </button>
      </div>

      <style jsx>{`
        /* --- Layout & Typography --- */
        .panel-header { margin-bottom: 2px; }
        .panel-header h2 { font-size: 1.05rem; font-weight: 600; margin-top: 2px; }
        .label { font-size: 0.68rem; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
        .mode-toggles { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; min-width: 0; }
        .toggle-container { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; min-width: 0; }
        
        .context-chip { 
          padding: 5px 10px; 
          font-size: 0.78rem; 
          background: rgba(16, 185, 129, 0.1); 
          border: 1px solid rgba(16, 185, 129, 0.2); 
          color: #6ee7b7;
          border-radius: 6px; 
          margin: 4px 0 6px; 
          max-width: 100%; 
          min-width: 0; 
          display: flex;
          align-items: center;
        }

        .context-chip.compare-active { 
          border-color: rgba(245, 158, 11, 0.3); 
          background: rgba(245, 158, 11, 0.15); 
          color: #fcd34d;
          padding: 4px 8px;
        }

        .compare-selectors-tray {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          min-width: 0;
        }

        .comp-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #fcd34d;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .comp-select {
          background: rgba(0, 0, 0, 0.4);
          color: #ffffff;
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 4px;
          font-size: 0.72rem;
          font-family: inherit;
          padding: 2px 6px;
          cursor: pointer;
          max-width: 120px;
          min-width: 0;
          text-overflow: ellipsis;
        }

        .comp-select:focus {
          outline: none;
          border-color: #fbbf24;
        }

        .context-chip.all-active { 
          border-color: rgba(16, 185, 129, 0.3); 
          background: rgba(16, 185, 129, 0.15); 
          color: #6ee7b7;
        }
        .empty-state { text-align: center; color: var(--text-muted); margin-top: 30px; font-size: 0.85rem; }
        .muted { color: var(--text-muted); }

        /* Improved chat rendering */
        .chat-box { 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
          padding: 8px 0; 
          overflow-y: auto; 
          overflow-x: hidden; 
          min-height: 0; 
          flex: 1; 
          min-width: 0; 
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .chat-box::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
        .chat-msg { display: flex; width: 100%; min-width: 0; }
        .chat-msg.bot { justify-content: flex-start; }
        .chat-msg.user { justify-content: flex-end; }

        .msg-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 85%;
          min-width: 0;
          gap: 4px;
        }

        .chat-msg.user .msg-wrapper {
          align-items: flex-end;
        }

        .chat-msg.bot .msg-wrapper {
          align-items: flex-start;
        }

        .msg-content { 
          min-width: 0; 
          padding: 8px 12px; 
          border-radius: 12px; 
          font-size: 0.9rem;
          line-height: 1.45;
          overflow: hidden; 
          white-space: normal; 
          word-break: break-word; 
          overflow-wrap: anywhere; 
        }
        .msg-content.structured {
          width: 100%;
        }
        
        .chat-msg.user .msg-content { 
          background: var(--primary-grad); 
          color: white; 
          border-bottom-right-radius: 2px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        
        .chat-msg.bot .msg-content { 
          background: rgba(255, 255, 255, 0.05); 
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f1f5f9; 
          border-bottom-left-radius: 2px;
        }

        .text-body { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; line-height: 1.45; max-width: 100%; }
        .plain-response { max-width: 100%; min-width: 0; }

        /* Chat input/sticky tray */
        .chat-input-row { 
          display: flex; 
          gap: 8px; 
          padding: 10px 0 0; 
          border-top: 1px solid rgba(255, 255, 255, 0.08); 
          background: transparent; 
          align-items: center; 
          margin-top: auto;
        }
        .chat-input-row input { 
          flex: 1; 
          min-width: 0; 
          padding: 10px 14px; 
          border-radius: 10px; 
          border: 1px solid rgba(255, 255, 255, 0.12); 
          background: rgba(255, 255, 255, 0.05); 
          color: #ffffff; 
          box-shadow: none;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .chat-input-row input:focus {
          outline: none;
          border-color: #10b981;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        .chat-input-row input::placeholder { color: rgba(255, 255, 255, 0.4); }
        .chat-input-row .btn { 
          padding: 10px 16px; 
          border-radius: 10px; 
          flex: 0 0 auto; 
          min-width: 70px; 
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }
        .chat-input-row .btn.primary { 
          color: #fff; 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15);
        }
        .chat-input-row .btn.primary:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
          transform: translateY(-1px);
        }
        .chat-input-row .btn.secondary { 
          color: #fff; 
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%); 
          border: 1px solid rgba(217, 119, 6, 0.2);
          box-shadow: 0 2px 6px rgba(217, 119, 6, 0.15);
        }
        .chat-input-row .btn.secondary:hover {
          background: linear-gradient(135deg, #b45309 0%, #92400e 100%);
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
          transform: translateY(-1px);
        }

        /* Typing Indicator styles */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          background-color: var(--text-muted);
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.3s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.3;
          } 40% { 
            transform: scale(1.0);
            opacity: 1;
          }
        }

        /* --- Toggle Switch CSS --- */
        .switch { position: relative; display: inline-block; width: 34px; height: 18px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        
        .slider { 
          position: absolute; 
          cursor: pointer; 
          top: 0; left: 0; right: 0; bottom: 0; 
          background-color: rgba(255, 255, 255, 0.1); 
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: .3s; 
        }
        .slider:before { 
          position: absolute; 
          content: ""; 
          height: 12px; width: 12px; 
          left: 2px; bottom: 2px; 
          background-color: white; 
          transition: .3s; 
        }
        
        input:checked + .slider { background-color: #10b981; border-color: #10b981; }
        input:checked + .slider:before { transform: translateX(16px); }
        
        .slider.round { border-radius: 18px; }
        .slider.round:before { border-radius: 50%; }
        
        /* Disabled state styling */
        .slider.disabled { cursor: not-allowed; background-color: rgba(255, 255, 255, 0.05); opacity: 0.4; }
        .toggle-label { font-weight: 500; color: var(--text-muted); }

        @media (max-width: 640px) {
          .header-flex {
            flex-direction: row;
            justify-content: space-between;
          }

          .chat-input-row {
            flex-direction: row;
          }

          .mode-toggles {
            width: auto;
            gap: 8px;
          }

          .toggle-container {
            width: auto;
          }

          .chat-msg.bot,
          .chat-msg.user {
            justify-content: flex-start;
          }

          .msg-wrapper {
            width: 100%;
            max-width: 100%;
          }

          .chat-box {
            padding: 4px 0;
          }

          .chat-input-row .btn {
            width: auto;
          }
        }
      `}</style>
    </section>
  );
}