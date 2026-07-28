import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationDto } from '@gig/shared';
import { api } from '../lib/api';
import { useSocket } from '../lib/socket';
import { Button } from './ui';

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const onEvent = useCallback((event: string) => {
    if (event === 'notification:new') qc.invalidateQueries({ queryKey: ['notifications'] });
  }, [qc]);

  useSocket(onEvent);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<{ unreadCount: number; notifications: NotificationDto[] }>('/notifications'),
    refetchInterval: 60000,
  });

  async function markAllRead() {
    await api('/notifications/read-all', { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-300 hover:bg-slate-800"
        aria-label="Notifications"
      >
        🔔
        {(data?.unreadCount ?? 0) > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {data!.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <span className="text-sm font-medium text-white">Notifications</span>
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={markAllRead}>Mark all read</Button>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {(data?.notifications ?? []).length === 0 ? (
              <li className="px-3 py-4 text-sm text-slate-500">No notifications</li>
            ) : (
              data!.notifications.map((n) => (
                <li key={n.id} className={`border-b border-slate-800/50 px-3 py-2 text-sm ${n.read ? 'text-slate-500' : 'text-slate-200'}`}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs">{n.message}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
