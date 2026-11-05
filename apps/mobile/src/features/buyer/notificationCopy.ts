import type { NotificationRow } from './api';

/** In-app list text for each notification type (mirrors push copy, design brief §9.1). */
export function notificationText(n: NotificationRow): { title: string; body: string } {
  const p = n.payload as Record<string, string | undefined>;
  return { title: p.title ?? 'Sabzi', body: p.body ?? '' };
}

/** Where tapping a notification goes. */
export function notificationTarget(n: NotificationRow): { pathname: string; params?: Record<string, string> } {
  const p = n.payload as Record<string, string | undefined>;
  switch (n.type) {
    case 'deal':
      return { pathname: '/buyer/deals' };
    case 'request_reply':
      return { pathname: '/(buyer)/requests' };
    case 'vendor_new_requests':
      return { pathname: '/(vendor)/requests' };
    case 'vendor_new_rating':
      return { pathname: '/vendor/reviews' };
    default:
      return p.vendor_id ? { pathname: '/buyer/vendor/[id]', params: { id: p.vendor_id, ...(p.society_id ? { society: p.society_id } : {}) } } : { pathname: '/' };
  }
}
