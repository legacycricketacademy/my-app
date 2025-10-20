export const nowLocalISO = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  // yyyy-MM-ddTHH:mm (strip seconds/ms)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Convert a local naive "yyyy-MM-ddTHH:mm" into a true UTC ISO string
export const localMinutesToUtcIso = (local: string) => {
  // Safari-safe: split components instead of new Date(local)
  const [date, time] = local.split('T')
  const [y,m,d] = date.split('-').map(Number)
  const [hh,mm] = time.split(':').map(Number)
  const utc = new Date(y, (m-1), d, hh, mm)
  return new Date(utc.getTime() - utc.getTimezoneOffset()*60000).toISOString()
}

// Format UTC ISO string to local datetime-local format
export const utcToLocalMinutes = (utcIso: string) => {
  const d = new Date(utcIso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

