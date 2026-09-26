/**
 * Static stand-in for devices without WebGL (or with Save-Data on): the same
 * katana — polished steel, teal grip, brass guard — drawn in SVG. Costs almost nothing.
 */
export function SceneFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute left-[70%] top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(77_163_255/0.14),transparent_62%)]" />
      <svg viewBox="0 0 100 420" className="absolute left-[70%] top-1/2 h-[80vh] -translate-x-1/2 -translate-y-1/2 opacity-85" aria-hidden>
        <defs>
          <linearGradient id="fb-steel" x1="0" x2="1">
            <stop offset="0" stopColor="#6b7079" />
            <stop offset="0.5" stopColor="#f1f3f7" />
            <stop offset="1" stopColor="#9aa0aa" />
          </linearGradient>
        </defs>
        {/* grip (top) — the blade falls tip-down */}
        <rect x="46" y="8" width="8" height="96" rx="3" fill="#12262d" />
        {[18, 32, 46, 60, 74, 88].map((y) => (
          <path key={y} d={`M50 ${y - 5} L53 ${y} L50 ${y + 5} L47 ${y} Z`} fill="#e9e6de" />
        ))}
        <rect x="45" y="2" width="10" height="7" rx="2" fill="#b8924a" />
        <ellipse cx="50" cy="108" rx="17" ry="4" fill="#b8924a" />
        <path d="M45 112 L45 380 Q46 402 54 414 Q56 396 56 380 L56 112 Z" fill="url(#fb-steel)" />
        <path d="M56 112 L56 380 Q56 396 54 414" stroke="#4da3ff" strokeOpacity="0.5" strokeWidth="0.8" fill="none" />
      </svg>
    </div>
  );
}
