import { useState } from 'react';
import { NavLink, useLocation, Navigate } from 'react-router-dom';
import { useApp } from '../../../context/useApp';
import { useTranslation, LanguageSwitcher } from '../../../i18n';
import { ProfileView } from '../Profile/ProfileView';
import { RoleRequestsPanel } from '../Profile/RoleRequestsPanel';
import { ProfileTeamPanel } from '../Profile/ProfileTeamPanel';
import { playersService } from '../../../services/playersService';
import { settingsService } from '../../../services/settingsService';
import { useResource } from '../../../hooks/useResource';
import { ListPageLayout, PageHeader, ListError } from '../../common/ListPage';
import { SecurityPanel } from './SecurityPanel';
import type { NavigationSection } from '../../../context/navigation';

const tabs = ['profile', 'sports-cv', 'team', 'roles', 'bookings', 'applications', 'notifications', 'preferences', 'security'] as const;
const labels = ['settings.profile', 'settings.cv', 'settings.team', 'settings.roles', 'settings.bookings', 'settings.applications', 'settings.notifications', 'settings.preferences', 'settings.security'] as const;

function TeamSettings() {
  const { user } = useApp();
  const player = useResource(user?.id ?? '', playersService.getMine, null);
  return <><ListError error={player.error} onRetry={player.refresh} /><ProfileTeamPanel currentTeamId={player.data?.currentTeamId} currentTeamName={player.data?.currentTeam ?? user?.sportsCv.currentTeam} /></>;
}

function PreferencesPanel() {
  const { t, language } = useTranslation();
  const { user, refreshUser, showToast } = useApp();
  const [showActivity, setShowActivity] = useState(user?.preferences?.showPersonalActivity !== false);
  const [saving, setSaving] = useState(false);
  return <form className="space-y-5 rounded-3xl border border-pitch-line bg-white p-5" onSubmit={async (event) => {
    event.preventDefault(); setSaving(true);
    try { await settingsService.preferences({ language, showPersonalActivity: showActivity }); await refreshUser(); showToast(t('settings.saved')); }
    catch (error) { showToast(error instanceof Error ? error.message : t('matches.loadError'), 'error'); } finally { setSaving(false); }
  }}><LanguageSwitcher /><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={showActivity} onChange={(event) => setShowActivity(event.target.checked)} />{t('settings.activityNotifications')}</label><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-pitch-primary px-4 font-bold text-white disabled:opacity-50">{t('settings.save')}</button></form>;
}

function NotificationSettings() {
  const { notifications, markAllNotificationsRead, markNotificationRead, navigateToResource, showToast } = useApp();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  return <div className="space-y-3"><button type="button" disabled={busy} className="min-h-11 rounded-xl border border-pitch-line px-4 text-sm" onClick={async () => {
    setBusy(true); try { await markAllNotificationsRead(); } catch (error) { showToast(String(error), 'error'); } finally { setBusy(false); }
  }}>{t('notifications.readAll')}</button>{notifications.map((notification) => <button type="button" key={notification.id} className="block w-full rounded-2xl border border-pitch-line bg-white p-4 text-left" onClick={async () => {
    try { await markNotificationRead(notification.id); navigateToResource(notification.targetSection as NavigationSection, notification.targetId); } catch (error) { showToast(String(error), 'error'); }
  }}><strong className="text-sm">{!notification.isRead && '• '}{notification.title}</strong><span className="block text-xs text-slate-500">{notification.message}</span></button>)}</div>;
}

export const SettingsView = () => {
  const { t } = useTranslation();
  const { logout, showToast } = useApp();
  const location = useLocation();
  const section = location.pathname.split('/')[2] || 'profile';
  if (!tabs.includes(section as typeof tabs[number])) return <Navigate to="/settings/profile" replace />;
  return <ListPageLayout>
    <PageHeader title={t('nav.settings')} description={t('settings.description')} actions={<button type="button" className="min-h-11 rounded-xl border border-rose-200 px-4 text-sm text-rose-700" onClick={() => void logout().catch((error) => showToast(String(error), 'error'))}>{t('settings.logout')}</button>} />
    <nav aria-label={t('nav.settings')} className="flex flex-wrap gap-2">{tabs.map((tab, index) => <NavLink key={tab} to={'/settings/' + tab} className={({ isActive }) => 'min-h-11 rounded-xl border px-4 py-3 text-sm font-bold ' + (isActive ? 'bg-pitch-primary text-white' : 'border-pitch-line bg-white')}>{t(labels[index])}</NavLink>)}</nav>
    {['profile', 'sports-cv', 'bookings', 'applications'].includes(section) && <ProfileView embedded />}
    {section === 'team' && <TeamSettings />}
    {section === 'roles' && <RoleRequestsPanel />}
    {section === 'preferences' && <PreferencesPanel />}
    {section === 'notifications' && <NotificationSettings />}
    {section === 'security' && <SecurityPanel />}
  </ListPageLayout>;
};
