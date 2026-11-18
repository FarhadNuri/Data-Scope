'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Badge } from '@/components/ui/Badge';
import { DatasetPicker } from '@/components/explorer/DatasetPicker';
import * as datasetsService from '@/services/datasets.service';
import * as usersService from '@/services/users.service';
import * as permissionsService from '@/services/permissions.service';
import type { Dataset, PermissionLevel } from '@/types/dataset';
import type { AdminUser } from '@/types/auth';

export default function AdminPermissionsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [permMap, setPermMap] = useState<Record<string, PermissionLevel | 'none'>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    datasetsService.listDatasets({ pageSize: 100 })
      .then((res) => {
        setDatasets(res.data);
        if (res.data.length > 0) setSelectedDatasetId(res.data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load datasets'));
  }, []);

  const fetchPermissionsAndUsers = useCallback(async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const [perms, usersRes] = await Promise.all([
        permissionsService.getPermissions(selectedDatasetId),
        usersService.listUsers({ pageSize: 100 }),
      ]);

      const nonAdmins = usersRes.data.filter((u) => u.role !== 'ADMIN');
      setUsers(nonAdmins);

      const mapping: Record<string, PermissionLevel | 'none'> = {};
      nonAdmins.forEach((u) => { mapping[u.id] = 'none'; });
      perms.forEach((p) => { mapping[p.userId] = p.level; });
      setPermMap(mapping);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [selectedDatasetId]);

  useEffect(() => {
    fetchPermissionsAndUsers();
  }, [fetchPermissionsAndUsers]);

  const handleLevelChange = (userId: string, level: PermissionLevel | 'none') => {
    setPermMap((prev) => ({ ...prev, [userId]: level }));
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    if (!selectedDatasetId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = Object.entries(permMap)
      .filter(([, level]) => level !== 'none')
      .map(([userId, level]) => ({ userId, level: level as PermissionLevel }));

    try {
      await permissionsService.replacePermissions(selectedDatasetId, payload);
      setSuccessMsg('Permissions updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dataset Permissions</h1>
          <DatasetPicker datasets={datasets} selectedId={selectedDatasetId} onSelect={setSelectedDatasetId} />
        </div>
        {selectedDatasetId && (
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving} disabled={loading || users.length === 0}>
            Save Permissions
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
      {successMsg && <div className="p-2.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded text-xs">{successMsg}</div>}

      {loading ? (
        <div className="p-8 text-center"><Spinner text="Loading permissions..." /></div>
      ) : users.length === 0 ? (
        <p className="p-8 text-center text-gray-400 italic text-xs">No non-admin users to assign permissions to</p>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 font-medium">User Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Platform Role</th>
                <th className="px-3 py-2 font-medium text-right">Access Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
                  <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{u.email}</td>
                  <td className="px-3 py-2"><Badge text={u.role} color="gray" /></td>
                  <td className="px-3 py-2 text-right">
                    <select
                      value={permMap[u.id] || 'none'}
                      onChange={(e) => handleLevelChange(u.id, e.target.value as PermissionLevel | 'none')}
                      className="border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-xs px-2 py-0.5"
                    >
                      <option value="none">None (No Access)</option>
                      <option value="view">View (Read Only)</option>
                      <option value="manage">Manage (Read + Edit)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
