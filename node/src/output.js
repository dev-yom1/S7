const SENSITIVE_KEYS = new Set(['token', 'tokens', 'item_data', 'authorization', 'api_token', 'password', 'pass']);

function mask(value) {
  const text = String(value);
  if (text.length <= 8) return '<redacted>';
  return `${text.slice(0, 3)}…${text.slice(-3)}`;
}

export function sanitize(value, { revealSecrets = false, key = '' } = {}) {
  if (revealSecrets) return value;
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
    if (Array.isArray(value)) return `<redacted ${value.length} item(s)>`;
    return mask(value);
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, sanitize(childValue, { key: childKey })]));
  }
  return value;
}

export function printResult(value, { json = false, jsonl = false, compact = false, revealSecrets = false } = {}, io = console) {
  // Machine-readable modes are an API contract: emit the response unchanged.
  if (json || jsonl || compact) {
    io.log(JSON.stringify(value, null, (compact || jsonl) ? 0 : 2));
    return;
  }

  // Human output is safe-by-default and masks credentials recursively.
  const safe = sanitize(value, { revealSecrets });
  if (Array.isArray(safe)) {
    safe.forEach((item, index) => {
      if (item && typeof item === 'object') {
        io.log(`${index + 1}. ${item.title ?? item.product ?? item.id ?? 'item'}`);
        for (const [key, val] of Object.entries(item)) io.log(`   ${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`);
      } else io.log(`${index + 1}. ${item}`);
    });
    return;
  }
  if (safe && typeof safe === 'object') {
    for (const [key, val] of Object.entries(safe)) io.log(`${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`);
    return;
  }
  io.log(String(safe));
}
