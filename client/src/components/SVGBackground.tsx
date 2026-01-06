import React from 'react';

export const SVGBackground: React.FC = () => {
  return (
    <svg
      className="fixed inset-0 w-full h-full"
      style={{
        background: 'radial-gradient(circle, rgb(0, 34, 35), black)',
        zIndex: 0,
      }}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Define the radial gradient */}
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(0, 34, 35)" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
      </defs>

      {/* Background rectangle with gradient */}
      <rect width="1000" height="1000" fill="url(#bgGradient)" />

      {/* Grid lines - subtle cyan lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <g key={`grid-${i}`}>
          {/* Vertical lines */}
          <line
            x1={i * 50}
            y1="0"
            x2={i * 50}
            y2="1000"
            stroke="rgba(0,255,255,0.05)"
            strokeWidth="1"
          />
          {/* Horizontal lines */}
          <line
            x1="0"
            y1={i * 50}
            x2="1000"
            y2={i * 50}
            stroke="rgba(0,255,255,0.05)"
            strokeWidth="1"
          />
        </g>
      ))}

      {/* Subtle circles for depth */}
      {Array.from({ length: 5 }).map((_, i) => (
        <circle
          key={`circle-${i}`}
          cx="500"
          cy="500"
          r={100 + i * 80}
          fill="none"
          stroke="rgba(0,255,255,0.02)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
};
