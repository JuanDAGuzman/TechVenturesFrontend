// Ilustraciones "blueprint" line-art para productos sin imagen propia.
// Se dibujan con currentColor para heredar el color de marca de cada categoría.

const fan = (cx, cy, r) => (
  <g key={`fan-${cx}-${cy}`}>
    <circle cx={cx} cy={cy} r={r} />
    <circle cx={cx} cy={cy} r={r * 0.18} fill="currentColor" stroke="none" />
    {[0, 60, 120, 180, 240, 300].map((a) => {
      const rad = (a * Math.PI) / 180;
      return (
        <path
          key={a}
          strokeWidth="2"
          d={`M ${cx + Math.cos(rad) * r * 0.22} ${cy + Math.sin(rad) * r * 0.22}
              Q ${cx + Math.cos(rad + 0.5) * r * 0.7} ${cy + Math.sin(rad + 0.5) * r * 0.7}
                ${cx + Math.cos(rad + 0.2) * r * 0.92} ${cy + Math.sin(rad + 0.2) * r * 0.92}`}
        />
      );
    })}
  </g>
);

const PATHS = {
  gpu: (
    <g>
      <rect x="14" y="46" width="158" height="58" rx="7" />
      <line x1="172" y1="55" x2="190" y2="55" />
      <line x1="172" y1="95" x2="190" y2="95" />
      <rect x="20" y="104" width="120" height="20" rx="2" />
      {fan(58, 75, 24)}
      {fan(128, 75, 24)}
    </g>
  ),
  component: (
    <g>
      <rect x="46" y="40" width="108" height="64" rx="6" />
      <rect x="62" y="56" width="76" height="32" rx="3" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <line x1={58 + i * 16} y1="32" x2={58 + i * 16} y2="40" />
          <line x1={58 + i * 16} y1="104" x2={58 + i * 16} y2="112" />
        </g>
      ))}
      <line x1="38" y1="56" x2="46" y2="56" />
      <line x1="38" y1="88" x2="46" y2="88" />
      <line x1="154" y1="56" x2="162" y2="56" />
      <line x1="154" y1="88" x2="162" y2="88" />
    </g>
  ),
  phone: (
    <g>
      <rect x="70" y="12" width="60" height="126" rx="12" />
      <circle cx="93" cy="28" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="103" cy="28" r="2.4" fill="currentColor" stroke="none" />
      <line x1="86" y1="122" x2="114" y2="122" />
    </g>
  ),
};

// Mapea cada categoría de la tienda a una forma de silueta
export const CATEGORY_FORM = {
  NVIDIA: "gpu",
  AMD: "gpu",
  Intel: "gpu",
  Componentes: "component",
  Celulares: "phone",
};

export default function Silhouette({ form, className }) {
  const path = PATHS[form] || PATHS.component;
  return (
    <svg
      className={className}
      viewBox="0 0 200 150"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}
