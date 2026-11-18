import type { SearchConfig } from '@/types/search';

// Formats a search configuration into a concise, human-readable summary
export function describeConfig(config?: SearchConfig | null): string {
  if (!config) return 'All records';

  const parts: string[] = [];

  // 1. Search text
  if (config.search && config.search.trim()) {
    parts.push(`"${config.search.trim()}"`);
  }

  // 2. Conditions summary
  const conditions = config.conditions || [];
  if (conditions.length === 1) {
    const c = conditions[0];
    const valStr = c.value !== undefined && c.value !== null ? ` ${c.value}` : '';
    parts.push(`${c.field} ${c.operator}${valStr}`);
  } else if (conditions.length === 2) {
    const desc = conditions
      .map((c) => {
        const valStr = c.value !== undefined && c.value !== null ? ` ${c.value}` : '';
        return `${c.field} ${c.operator}${valStr}`;
      })
      .join(' and ');
    parts.push(desc);
  } else if (conditions.length > 2) {
    parts.push(`${conditions.length} filters`);
  }

  // 3. Sort summary
  if (config.sort && config.sort.length > 0) {
    const sortDesc = config.sort
      .map((s) => `${s.field} ${s.direction === 'asc' ? '↑' : '↓'}`)
      .join(', ');
    parts.push(`sorted by ${sortDesc}`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'All records';
}
