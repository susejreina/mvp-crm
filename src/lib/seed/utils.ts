export function omitUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(omitUndefinedDeep) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = omitUndefinedDeep(v);
    }
    return out as T;
  }
  return value;
}
