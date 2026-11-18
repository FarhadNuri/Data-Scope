'use client';

type SharedUser = { id: string; name: string; email: string };

type SharedUsersListProps = {
  sharedWith: SharedUser[];
  onUnshare: (userId: string) => void;
};

export function SharedUsersList({ sharedWith, onUnshare }: SharedUsersListProps) {
  return (
    <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
      <span className="font-semibold text-gray-700 dark:text-gray-300 block">
        Currently shared with:
      </span>
      {sharedWith.length === 0 ? (
        <p className="text-gray-400 italic">This view is private to you.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded">
          {sharedWith.map((u) => (
            <div key={u.id} className="p-2 flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{u.name}</span>
                <span className="text-gray-500 text-[11px] ml-2">({u.email || u.id})</span>
              </div>
              <button
                type="button"
                onClick={() => onUnshare(u.id)}
                className="text-red-500 hover:text-red-700 text-xs px-1 font-semibold"
                title="Remove share"
              >
                ✕ Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
