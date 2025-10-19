import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

function todayISO() {
  const d = new Date();
  // YYYY-MM-DD for native <input type="date">
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

function formatAsISODate(value?: string | Date | null) {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

export function DobField() {
  // Assuming RHF is used in this modal:
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  // watch currently selected value (can be undefined on first render)
  const value = watch('dateOfBirth');
  const valueISO = useMemo(() => formatAsISODate(value), [value]);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Date of Birth *</label>
      <input
        type="date"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
        // IMPORTANT: force past/present only
        max={todayISO()}
        value={valueISO}
        // write back as full ISO string (UTC midnight) for consistency
        onChange={(e) => {
          const day = e.target.value; // YYYY-MM-DD
          setValue('dateOfBirth', day ? new Date(`${day}T00:00:00.000Z`).toISOString() : '');
        }}
      />
      {errors?.dateOfBirth && (
        <p className="text-sm text-red-600">{String((errors.dateOfBirth as any)?.message || 'Invalid date')}</p>
      )}
      <p className="text-xs text-gray-500">No future dates allowed.</p>
      {/* Keep a hidden input registered so RHF validates/submits this field */}
      <input type="hidden" {...register('dateOfBirth', {
        required: 'Date of birth is required',
        validate: (v: string) => {
          if (!v) return 'Date of birth is required';
          const d = new Date(v);
          if (isNaN(d.getTime())) return 'Invalid date';
          const now = new Date();
          if (d.getTime() > now.getTime()) return 'Date of birth cannot be in the future';
          return true;
        }
      })} />
    </div>
  );
}
