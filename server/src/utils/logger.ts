export const log = {
  info: (...args: unknown[]) => console.log('[info]', ...args),
  warn: (...args: unknown[]) => console.warn('[warn]', ...args),
  error: (...args: unknown[]) => console.error('[error]', ...args),
};

/** Redact obvious secret material before logging */
export const redact = (obj: unknown): unknown => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const clone: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  for (const k of Object.keys(clone)) {
    if (/secret|token|authorization|password/i.test(k)) clone[k] = '[REDACTED]';
    else if (typeof clone[k] === 'object' && clone[k] !== null) clone[k] = redact(clone[k]);
  }
  return clone;
};
