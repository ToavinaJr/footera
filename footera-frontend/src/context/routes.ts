import type { NavigationSection } from './navigation';

/** One mapping for navigation, notifications and legacy links. */
export function sectionPath(section: NavigationSection): string {
  if (section === 'recruitment' || section === 'mercato') return '/mercato';
  if (section === 'bookings') return '/settings/bookings';
  if (section === 'profile') return '/settings/profile';
  return `/${section}`;
}

export function legacyPath(pathname: string): string {
  if (/^\/recruitment(?:\/|$)/.test(pathname)) return pathname.replace('/recruitment', '/mercato');
  if (pathname === '/profile') return '/settings/profile';
  if (pathname === '/profile/edit-cv') return '/settings/sports-cv';
  if (/^\/profile\/(bookings|applications)(?:\/|$)/.test(pathname)) return pathname.replace('/profile', '/settings');
  return pathname;
}

export function resourcePath(section: NavigationSection, id?: string): string {
  if (section === 'players' && id) return `/profile/${encodeURIComponent(id)}`;
  return `${sectionPath(section)}${id ? `/${encodeURIComponent(id)}` : ''}`;
}
