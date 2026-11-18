'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { UsersTable } from '@/components/admin/UsersTable';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spinner } from '@/components/ui/Spinner';
import * as usersService from '@/services/users.service';
import type { AdminUser, Role } from '@/types/auth';
import type { PaginationMeta } from '@/types/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersService.listUsers({
        page,
        pageSize,
        search: debouncedSearch.trim() || undefined,
        role: roleFilter || undefined,
        isActive: activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, roleFilter, activeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (user: AdminUser, newRole: Role) => {
    setActionError(null);
    try {
      await usersService.changeRole(user.id, newRole);
      fetchUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    setActionError(null);
    try {
      await usersService.updateUser(user.id, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to change active status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">User Management</h1>
      </div>

      {actionError && <ErrorMessage message={actionError} />}

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-gray-800 rounded px-2.5 py-1 bg-white dark:bg-gray-900 text-xs w-56"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as Role | ''); setPage(1); }}
          className="border border-gray-200 dark:border-gray-800 rounded px-2 py-1 bg-white dark:bg-gray-900 text-xs"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ANALYST">ANALYST</option>
          <option value="VIEWER">VIEWER</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-gray-800 rounded px-2 py-1 bg-white dark:bg-gray-900 text-xs"
        >
          <option value="">All Statuses</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      {loading && users.length === 0 ? (
        <div className="p-8 text-center"><Spinner text="Loading users..." /></div>
      ) : (
        <UsersTable
          users={users}
          onRoleChange={handleRoleChange}
          onToggleActive={handleToggleActive}
          loading={loading}
        />
      )}

      {meta && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={meta.totalItems}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
        />
      )}
    </div>
  );
}
