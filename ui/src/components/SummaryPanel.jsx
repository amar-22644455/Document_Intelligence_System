import LoadingSkeleton from './LoadingSkeleton';
import { useState } from 'react';

export default function SummaryPanel({
  activeDocument,
  summary,
  importantPoints,
  isAnalyzing,
  activeDocData = null
}) {
  const [expandedChunk, setExpandedChunk] = useState(null);

  // Extract structured insights if available
  const answerData = activeDocData?.answer || {};
  const keyInsights = Array.isArray(answerData.key_insights) ? answerData.key_insights : [];
  const relevantSections = Array.isArray(answerData.relevant_sections) ? answerData.relevant_sections : [];
  const sourceChunks = Array.isArray(activeDocData?.sources) ? activeDocData.sources : [];

  // Determine file metadata
  const fileExt = activeDocument ? activeDocument.split('.').pop().toUpperCase() : '';
  const isPDF = fileExt === 'PDF';
  const isImage = ['PNG', 'JPG', 'JPEG', 'BMP', 'TIFF'].includes(fileExt);


  return (
    <section className="panel middle-panel">
      <div className="panel-header middle-head">
        <div>
          <p className="label">Document Insights</p>
          {isAnalyzing && (
            <span className="analyzing-indicator">🔄 Indexing & Ingesting...</span>
          )}
        </div>
      </div>

      {/* Active Document and Metadata Section */}
      <div className="context-indicators">
        {activeDocument && (
          <div className="indicator-chip">
            <span className="label-text">Active Document:</span>
            <span className="value-text" title={activeDocument}>{activeDocument}</span>
            <span className="metadata-pill">{fileExt}</span>
          </div>
        )}

      </div>

      <div className="middle-content">
        {isAnalyzing ? (
          <div className="card loading-card">
            <LoadingSkeleton lines={8} />
          </div>
        ) : !activeDocument ? (
          <div className="empty-insights-state">
            <p className="empty-title">Select a Document</p>
            <p className="empty-desc">Choose a document from the left panel to display deep-dive insights, summaries, key vectors, and source attributions.</p>
          </div>
        ) : (
          <>
            {/* 1. Main Document Summary */}
            <div className="card insight-card">
              <p className="section-title">Executive Summary</p>
              <div className="document-preview">
                <div className="summary-text" aria-live="polite">
                  {summary}
                </div>
              </div>
            </div>

            {/* 2. Key Insights Grid */}
            {keyInsights.length > 0 && (
              <div className="card insight-card">
                <p className="section-title">Document Key Insights</p>
                <div className="insights-grid">
                  {keyInsights.map((insight, idx) => (
                    <div key={`insight-${idx}`} className="insight-item-card">
                      <div className="insight-header">
                        <span className="insight-bullet-dot"></span>
                        <h4 className="insight-item-title">{insight.title}</h4>
                      </div>
                      <p className="insight-item-explanation">{insight.explanation}</p>
                      {insight.evidence && insight.evidence.length > 0 && (
                        <div className="insight-item-evidence">
                          <span>Evidence:</span> {insight.evidence.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Relevant Document Sections / Clauses */}
            {relevantSections.length > 0 && (
              <div className="card insight-card">
                <p className="section-title">Document Structure & Key Clauses</p>
                <div className="sections-list">
                  {relevantSections.map((section, idx) => (
                    <div key={`section-${idx}`} className="section-item-row">
                      <div className="section-bullet"></div>
                      <div className="section-body">
                        <h4 className="section-item-title">{section.section_title}</h4>
                        <p className="section-item-summary">{section.section_summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Grounding Sources Accordion */}
            {sourceChunks.length > 0 && (
              <div className="card insight-card">
                <p className="section-title">Source Grounding & Vector Chunks</p>
                <p className="sources-help-text">These verified text segments were retrieved from the document database to construct this analysis:</p>
                <div className="grounding-chunks-list">
                  {sourceChunks.map((src, idx) => {
                    const pageNum = src.source?.page;
                    const chunkIdx = src.source?.chunk_index;
                    const matchScore = src.score ? Math.round(src.score * 100) : null;
                    const isExpanded = expandedChunk === idx;

                    return (
                      <div 
                        key={`chunk-${idx}`} 
                        className={`grounding-chunk-card ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedChunk(isExpanded ? null : idx)}
                      >
                        <div className="chunk-card-header">
                          <div className="chunk-label">
                            <span className="doc-icon-mini">📄</span>
                            <span className="chunk-name">Chunk {chunkIdx !== undefined ? chunkIdx + 1 : idx + 1}</span>
                            {pageNum && <span className="chunk-page-pill">Page {pageNum}</span>}
                          </div>
                          {matchScore && (
                            <span className="chunk-score-pill">{matchScore}% Similarity</span>
                          )}
                        </div>
                        
                        <div className="chunk-preview-text">
                          {isExpanded ? src.chunk : `${src.chunk.substring(0, 140)}...`}
                        </div>
                        <div className="chunk-expand-indicator">
                          {isExpanded ? 'Click to collapse ⬆' : 'Click to view full segment ⬇'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .middle-panel {
          height: 100%;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .middle-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
          flex-shrink: 0;
        }

        .analyzing-indicator {
          font-size: 0.82rem;
          color: #a78bfa;
          font-weight: 600;
          animation: pulse 1.5s infinite;
        }

        .context-indicators {
          display: flex;
          gap: 8px;
          padding: 10px 20px 2px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .indicator-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 8px;
          font-size: 0.78rem;
          min-width: 0;
          max-width: 100%;
        }

        .indicator-chip.all-docs {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.15);
        }

        .indicator-chip .label-text {
          color: var(--text-muted);
          font-weight: 600;
        }

        .indicator-chip .value-text {
          color: var(--text-main);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .metadata-pill {
          font-size: 0.65rem;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          padding: 2px 5px;
          border-radius: 4px;
          margin-left: 4px;
        }

        .middle-content {
          padding: 14px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          scrollbar-width: thin;
        }

        .insight-card {
          flex-shrink: 0;
        }

        .section-title {
          margin: 0 0 12px 0;
          font-size: 0.95rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #93c5fd;
        }

        .summary-text {
          white-space: pre-wrap;
          line-height: 1.6;
          color: #e2e8f0;
          font-size: 0.92rem;
          overflow-wrap: anywhere;
        }

        /* Insights Grid & Card Styles */
        .insights-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .insight-item-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .insight-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .insight-bullet-dot {
          width: 6px;
          height: 6px;
          background: #fbbf24;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(251, 191, 36, 0.8);
        }

        .insight-item-title {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 600;
          color: #ffffff;
        }

        .insight-item-explanation {
          margin: 0;
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .insight-item-evidence {
          font-size: 0.72rem;
          color: #fbbf24;
          margin-top: 2px;
        }

        .insight-item-evidence span {
          font-weight: 600;
          color: var(--text-muted);
        }

        /* Outline / Sections outline style */
        .sections-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-item-row {
          display: flex;
          gap: 12px;
        }

        .section-bullet {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
        }

        .section-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .section-item-title {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 600;
          color: #ffffff;
        }

        .section-item-summary {
          margin: 0;
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        /* Grounding Chunks & Sources list */
        .sources-help-text {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .grounding-chunks-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .grounding-chunk-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .grounding-chunk-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .grounding-chunk-card.expanded {
          background: rgba(0, 0, 0, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
        }

        .chunk-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .chunk-label {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .doc-icon-mini {
          font-size: 0.75rem;
        }

        .chunk-name {
          font-weight: 600;
          color: #ffffff;
        }

        .chunk-page-pill {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
          padding: 1px 4px;
          border-radius: 4px;
          font-size: 0.65rem;
        }

        .chunk-score-pill {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 4px;
        }

        .chunk-preview-text {
          font-size: 0.8rem;
          color: #cbd5e1;
          line-height: 1.45;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .chunk-expand-indicator {
          font-size: 0.68rem;
          color: #10b981;
          align-self: flex-end;
          font-weight: 500;
        }

        /* Empty states */
        .empty-insights-state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
          text-align: center;
          gap: 8px;
          flex: 1;
        }

        .empty-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #cbd5e1;
          margin: 0;
        }

        .empty-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.5;
          max-width: 280px;
          margin: 0;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}