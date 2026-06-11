import React from 'react';

export default function JSONViewer({ data, maxHeight = 280 }) {
  // Safe stringify with fallback
  let pretty = '';
  try {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        pretty = JSON.stringify(parsed, null, 2);
      } catch {
        // not JSON, show raw
        pretty = data;
      }
    } else if (typeof data === 'object' && data !== null) {
      pretty = JSON.stringify(data, null, 2);
    } else {
      pretty = String(data);
    }
  } catch (e) {
    pretty = 'Unable to render JSON.';
  }

  return (
    <div className="json-viewer" role="region" aria-label="AI JSON response">
      <pre>{pretty}</pre>

      <style jsx>{`
        .json-viewer { 
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace;
          font-size: 0.85rem;
          color: #03254c;
          background: #f6f8fa;
          border: 1px solid #e1e4e8;
          padding: 12px;
          border-radius: 8px;
          overflow: hidden;
          max-height: ${maxHeight}px;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
          max-width: 100%;
        }

        .json-viewer pre { margin: 0; }
      `}</style>
    </div>
  );
}
