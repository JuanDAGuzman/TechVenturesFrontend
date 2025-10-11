export default function AppointmentTypeSelector({ value, onChange }) {
  return (
    <div className="type-selector">
      <label>
        <input
          type="radio"
          name="type"
          value="TRYOUT"
          checked={value === "TRYOUT"}
          onChange={(e) => onChange(e.target.value)}
        />
        Cita con ensayo
      </label>
      <label>
        <input
          type="radio"
          name="type"
          value="PICKUP"
          checked={value === "PICKUP"}
          onChange={(e) => onChange(e.target.value)}
        />
        Recogida sin ensayo
      </label>
      <label>
        <input
          type="radio"
          name="type"
          value="SHIPPING"
          checked={value === "SHIPPING"}
          onChange={(e) => onChange(e.target.value)}
        />
        Envío (no contraentrega)
      </label>
    </div>
  );
}
