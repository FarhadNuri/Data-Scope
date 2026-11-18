import crypto from 'crypto';

// Recursively sorts object keys to produce a deterministic JSON string.
// Ensures that { a: 1, b: 2 } and { b: 2, a: 1 } serialize identically.
function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`;
  }

  const sortedKeys = Object.keys(obj).sort();
  const keyValues = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`
  );

  return `{${keyValues.join(',')}}`;
}

// Produces a deterministic SHA-256 hexadecimal hash from any JavaScript object or value
export function hashObject(value) {
  const canonicalJson = stableStringify(value);
  return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}
