// Computes the field-level diff between two data snapshots for audit history
export function calculateChanges(oldData = {}, newData = {}) {
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
  const changes = [];

  for (const field of allKeys) {
    const oldVal = oldData ? oldData[field] : undefined;
    const newVal = newData ? newData[field] : undefined;

    // Compare values (handles primitives and null/undefined equality)
    if (oldVal !== newVal) {
      changes.push({
        field,
        oldValue: oldVal ?? null,
        newValue: newVal ?? null,
      });
    }
  }

  return changes;
}
