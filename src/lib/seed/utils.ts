export function omitUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(omitUndefinedDeep) as any;
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) {
      if (v !== undefined) out[k] = omitUndefinedDeep(v as any);
    }
    return out;
  }
  return value;
}
