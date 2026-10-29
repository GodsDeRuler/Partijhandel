/** Eén formulierveld met label (labelkoppeling via id). */
export function Veld({ id, label, type = "text", required, area, rows = 4, autoComplete, defaultValue, full, children }: {
  id: string; label: string; type?: string; required?: boolean; area?: boolean; rows?: number; autoComplete?: string; defaultValue?: string; full?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className={`field${full ? " full" : ""}`}>
      <label htmlFor={id}>{label}{required ? " *" : ""}</label>
      {children ?? (area
        ? <textarea id={id} name={id} rows={rows} required={required} defaultValue={defaultValue} />
        : <input id={id} name={id} type={type} required={required} autoComplete={autoComplete} defaultValue={defaultValue} />)}
    </div>
  );
}
