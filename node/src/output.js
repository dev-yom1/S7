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
  if (Array.isArray(value)) return value.map((item) => sanitize(item, { key }));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, sanitize(childValue, { key: childKey })]));
  }
  return value;
}

export function printResult(value, { json = false, jsonl = false, compact = false, revealSecrets = false } = {}) {
  const safe = sanitize(value, { revealSecrets });
  if (json || jsonl || compact) {
    console.log(JSON.stringify(safe, null, (compact || jsonl) ? 0 : 2));
    return;
  }
  if (Array.isArray(safe)) {
    safe.forEach((item, index) => {
      if (item && typeof item === 'object') {
        console.log(`${index + 1}. ${item.title ?? item.product ?? item.id ?? 'item'}`);
        for (const [key, val] of Object.entries(item)) console.log(`   ${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`);
      } else console.log(`${index + 1}. ${item}`);
    });
    return;
  }
  if (safe && typeof safe === 'object') {
    for (const [key, val] of Object.entries(safe)) console.log(`${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`);
    return;
  }
  console.log(String(safe));
}
