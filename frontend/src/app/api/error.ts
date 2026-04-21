export function extractApiErrorMessage(error: unknown): string {
  const err = error as { error?: Record<string, unknown> | string };
  const data = err?.error;
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data !== null && 'detail' in data) return String(data['detail']);
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length > 0) {
      const [field, messages] = entries[0];
      const msg = Array.isArray(messages) ? messages[0] : messages;
      return `${field}: ${String(msg)}`;
    }
  }
  return '';
}

