export default function TimeSlotPicker({ slots = [], value, onChange }) {
  if (!slots.length) {
    return (
      <p className="muted">No hay horarios disponibles para esta fecha.</p>
    );
  }
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
      {slots.map((s) => {
        const val = s.value ?? `${s.start}-${s.end}`;
        const label = s.label ?? `${s.start}–${s.end}`;
        const active = value === val;
        const disabled = !!s.disabled;

        return (
          <button
            key={val}
            onClick={() => !disabled && onChange(val)}
            disabled={disabled}
            className={`slot ${active ? "slot-active" : ""} ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={disabled ? "No disponible" : "Disponible"}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
