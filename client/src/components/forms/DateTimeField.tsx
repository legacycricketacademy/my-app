import { useMemo } from "react";

// Uses native pickers on mobile, HTML datetime-local on desktop.
// Accepts ISO string and emits ISO string.
export default function DateTimeField({
  value, onChange, testId, label="Date & Time",
}: { value?: string; onChange: (iso: string)=>void; testId?: string; label?: string }) {

  const isMobile = useMemo(()=> typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent), []);
  const local = useMemo(()=>{
    if (!value) return "";
    const d = new Date(value);
    const pad = (n:number)=> String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [value]);

  return (
    <label className="grid gap-1">
      <span className="text-sm">{label}</span>
      <input
        type={isMobile ? "datetime-local" : "datetime-local"}
        value={local}
        onChange={e=>{
          const v = e.target.value; // yyyy-MM-ddTHH:mm
          const iso = v ? new Date(v).toISOString() : "";
          onChange(iso);
        }}
        data-testid={testId || "input-datetime"}
        className="px-3 py-2 border rounded"
      />
    </label>
  );
}

