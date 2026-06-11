export default function LoadingSkeleton({ lines = 4 }) {
  return (
    <div className="skeleton" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="s-line" />
      ))}

      <style jsx>{`
        .skeleton { display: flex; flex-direction: column; gap: 8px; }
        .s-line { height: 12px; background: linear-gradient(90deg,#efefef,#f7f7f7,#efefef); border-radius: 6px; animation: shimmer 1.2s infinite; }
        .s-line:nth-child(odd) { width: 85%; }
        .s-line:nth-child(even) { width: 62%; }

        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>
    </div>
  );
}
