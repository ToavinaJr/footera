/** Decorative tactical board; CSS-only and respects reduced motion. */
export function FootballPitch() {
  return <div className="football-pitch" aria-hidden="true">
    <svg viewBox="0 0 480 280" fill="none" className="h-full w-full">
      <rect x="12" y="12" width="456" height="256" rx="4" />
      <path d="M240 12v256M12 70h70v140H12M468 70h-70v140h70M12 105h26v70H12M468 105h-26v70h26" />
      <circle cx="240" cy="140" r="42" /><circle cx="240" cy="140" r="3" fill="currentColor" />
      <path className="football-pass" d="M110 205 Q170 80 240 140 T375 70" strokeDasharray="6 8" />
      <g className="football-marker"><circle cx="110" cy="205" r="9" /><circle cx="240" cy="140" r="9" /><circle cx="375" cy="70" r="9" /></g>
    </svg>
    <span className="football-ball">⚽</span>
  </div>;
}

export function FootballLoader() {
  return <span className="football-loader" aria-hidden="true"><span>⚽</span><i /><i /><i /></span>;
}
