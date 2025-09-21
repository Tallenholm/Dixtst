export function formatTime(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function phaseLabel(phase?: string) {
  switch (phase) {
    case 'dawn':
      return 'Dawn';
    case 'day':
      return 'Daylight';
    case 'dusk':
      return 'Dusk';
    case 'night':
    default:
      return 'Night';
  }
}

export function intensityLabel(value: number) {
  return `${Math.round((value / 254) * 100)}%`;
}
