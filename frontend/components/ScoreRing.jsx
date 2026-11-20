export default function ScoreRing({ score = 0, size = 140, label }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = score >= 85 ? "#16a34a" : score >= 70 ? "#4f46e5" : score >= 50 ? "#f59e0b" : "#e11d48";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="-rotate-90" width={size} height={size}>
        <circle cx="60" cy="60" r={r} stroke="#e2e8f0" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r={r} stroke={color} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * score) / 100}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold" style={{ color }}>{score}</div>
        <div className="text-xs text-slate-500">{label || "/ 100"}</div>
      </div>
    </div>
  );
}
