/**
 * Decorative dark street map. Placeholder until a real tile provider
 * (MapLibre + a dark style) is wired in.
 */
export function MapBackdrop() {
  return (
    <svg className="absolute inset-0 h-full w-full bg-[#1a1a1a]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 800" aria-hidden>
      <g fill="#242424">
        <path d="M330 220c40-10 70 20 70 60v60c-30 10-60-10-70-40s-30-70 0-80z" />
        <path d="M300 560c20-20 50-10 60 10s-10 50-40 50-40-40-20-60z" />
        <path d="M0 620c30-10 60 10 60 40s-40 50-60 40z" />
      </g>
      <g stroke="#2b2b2b" strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M-20 120 L420 40" />
        <path d="M-20 340 C120 300 260 420 420 380" />
        <path d="M60 -20 C90 260 40 520 120 820" />
        <path d="M260 -20 C240 300 300 560 260 820" />
        <path d="M-20 700 L420 600" />
      </g>
      <g stroke="#262626" strokeWidth="4" fill="none">
        {Array.from({ length: 18 }, (_, i) => (
          <path key={`h${i}`} d={`M-20 ${i * 48 + 20} L420 ${i * 48 - 30}`} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 46 + 10} -20 L${i * 46 - 30} 820`} />
        ))}
      </g>
    </svg>
  );
}
