export default function Logo({ size = 'md' }) {
  const sizeMap = {
    sm: { width: 32, height: 32, textSize: 'text-lg' },
    md: { width: 40, height: 40, textSize: 'text-xl' },
    lg: { width: 48, height: 48, textSize: 'text-2xl' },
  };

  const { width, height, textSize } = sizeMap[size];

  return (
    <div className="flex items-center gap-3">
      {/* SVG Logo con gradiente */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#206DDA" />
            <stop offset="100%" stopColor="#4CAF50" />
          </linearGradient>
        </defs>

        {/* Fondo redondeado */}
        <rect width="40" height="40" rx="8" fill="url(#logoGradient)" opacity="0.1" />

        {/* X principal con gradiente */}
        <g stroke="url(#logoGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Primera línea de la X */}
          <line x1="10" y1="10" x2="30" y2="30" />
          {/* Segunda línea de la X */}
          <line x1="30" y1="10" x2="10" y2="30" />
        </g>

        {/* Circulo central */}
        <circle cx="20" cy="20" r="3" fill="url(#logoGradient)" />
      </svg>

      {/* Texto "InventarioX" */}
      <span className="font-black text-2xl bg-gradient-to-r from-[#206DDA] to-[#4CAF50] bg-clip-text text-transparent">
        InventarioX
      </span>
    </div>
  );
}
