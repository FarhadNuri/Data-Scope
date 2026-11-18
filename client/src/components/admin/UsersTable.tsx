'use client';

import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import type { AdminUser, Role } from '@/types/auth';

type UsersTableProps = {
  users: AdminUser[];
  onRoleChange: (user: AdminUser, newRole: Role) => void;
  onToggleActive: (user: AdminUser) => void;
  loading?: boolean;
};

export function UsersTable({
  users,
  onRoleChange,
  onToggleActive,
  loading = false,
}: UsersTableProps) {
  if (users.length === 0 && !loading) {
    return <p className="p-8 text-center text-gray-400 italic text-xs">No users found</p>;
  }

  return (
    <div className={`overflow-x-auto border border-gray-200 dark:border-gray-800 rounded ${loading ? 'opacity-50' : ''}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium text-right">Active Toggle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
              <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{u.email}</td>
              <td className="px-3 py-2">
                <select
                  value={u.role}
                  onChange={(e) => onRoleChange(u, e.target.value as Role)}
                  className="border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-xs px-2 py-0.5"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="ANALYST">ANALYST</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </td>
              <td className="px-3 py-2">
                <Badge
                  text={u.isActive ? 'Active' : 'Inactive'}
                  color={u.isActive ? 'green' : 'gray'}
                />
              </td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onToggleActive(u)}
                  className={`text-xs px-2 py-0.5 rounded border font-medium ${
                    u.isActive
                      ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400'
                      : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-400'
                  }`}
                >
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
