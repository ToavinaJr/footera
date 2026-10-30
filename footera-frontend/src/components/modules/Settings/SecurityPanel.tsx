import { useState } from 'react';
import { useApp } from '../../../context/useApp';
import { useTranslation } from '../../../i18n';
import { settingsService } from '../../../services/settingsService';
import { useResource } from '../../../hooks/useResource';
import { ListError } from '../../common/ListPage';

export function SecurityPanel() {
  const { t, language } = useTranslation();
  const { user, logout, showToast } = useApp();
  const sessions = useResource(user?.id ?? '', settingsService.sessions, []);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  return <div className="space-y-6">
    <form className="space-y-4 rounded-3xl border border-pitch-line bg-white p-5" onSubmit={async (event) => {
      event.preventDefault(); if (busy) return; setBusy(true);
      try { await settingsService.changePassword(currentPassword, newPassword); setCurrentPassword(''); setNewPassword(''); showToast(t('settings.passwordChanged')); await logout(); }
      catch (error) { showToast(error instanceof Error ? error.message : t('matches.loadError'), 'error'); }
      finally { setBusy(false); }
    }}>
      <h2 className="card-title font-extrabold">{t('settings.changePassword')}</h2>
      <label className="block text-sm">{t('settings.currentPassword')}<input type="password" autoComplete="current-password" required maxLength={256} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-pitch-line px-3" /></label>
      <label className="block text-sm">{t('settings.newPassword')}<input type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-pitch-line px-3" /></label>
      <button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-pitch-primary px-4 text-sm font-bold text-white disabled:opacity-50">{t('settings.changePassword')}</button>
    </form>
    <section className="space-y-4 rounded-3xl border border-pitch-line bg-white p-5"><h2 className="card-title font-extrabold">{t('settings.sessions')}</h2><ListError error={sessions.error} onRetry={sessions.refresh} />
      {sessions.loading && <p>{t('common.loading')}</p>}
      {sessions.data.map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-pitch-line py-3 text-sm"><span>{session.current ? t('settings.currentSession') : t('settings.sessions')} · <time dateTime={session.expiresAt}>{new Date(session.expiresAt).toLocaleString(language === 'mg' ? 'fr-MG' : language)}</time></span><button type="button" disabled={busy} className="min-h-11 rounded-xl border border-rose-200 px-4 text-rose-700 disabled:opacity-50" onClick={async () => {
        setBusy(true); try { await settingsService.revokeSession(session.id); if (session.current) await logout(); else sessions.refresh(); }
        catch (error) { showToast(error instanceof Error ? error.message : t('matches.loadError'), 'error'); } finally { setBusy(false); }
      }}>{t('settings.revoke')}</button></div>)}
    </section>
  </div>;
}
