/**
 * Static stand-in for devices without WebGL (or with Save-Data on): the same
 * blade silhouette and light, drawn in SVG + CSS. Costs almost nothing.
 */
export function SceneFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(77_163_255/0.16),transparent_62%)]" />
      <svg
        viewBox="0 0 100 400"
        className="absolute left-[58%] top-1/2 h-[78vh] -translate-x-1/2 -translate-y-1/2 rotate-[33deg] opacity-80"
        aria-hidden
      >
        <defs>
          <linearGradient id="fb-steel" x1="0" x2="1">
            <stop offset="0" stopColor="#060607" />
            <stop offset="0.45" stopColor="#2a2b31" />
            <stop offset="0.55" stopColor="#141417" />
            <stop offset="1" stopColor="#6b6e76" />
          </linearGradient>
          <linearGradient id="fb-edge" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ff6a70" />
            <stop offset="1" stopColor="#ff2338" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d="M44 300 L44 40 Q46 14 60 4 Q58 30 57 60 L57 300 Z" fill="url(#fb-steel)" />
        <path d="M57 60 Q58 30 60 4" stroke="url(#fb-edge)" strokeWidth="1.2" fill="none" />
        <line x1="57" y1="60" x2="57" y2="300" stroke="url(#fb-edge)" strokeWidth="0.8" />
        <ellipse cx="50" cy="304" rx="20" ry="4" fill="#1b1c22" stroke="#3a3d46" strokeWidth="0.6" />
        <rect x="46" y="308" width="8" height="90" rx="3" fill="#0b0b0f" />
        {[316, 328, 340, 352, 364, 376, 388].map((y) => (
          <path key={y} d={`M50 ${y - 4} L52.5 ${y} L50 ${y + 4} L47.5 ${y} Z`} fill="#c8182a" />
        ))}
      </svg>
    </div>
  );
}
