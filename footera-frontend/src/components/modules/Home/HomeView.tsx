import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../context/useApp';
import { useTranslation } from '../../../i18n';
import { useResource } from '../../../hooks/useResource';
import { dashboardService, type DashboardData } from '../../../services/dashboardService';
import { teamsService } from '../../../services/teamsService';
import { ListPageLayout, PageHeader, ListError } from '../../common/ListPage';
import { CardSkeleton } from '../../common/Skeleton';
import { Modal } from '../../common/Modal';
import { DashboardSection, DashboardMatchCard, ActivityList } from './DashboardSection';
import { FootballPitch } from '../../common/FootballPitch';

export const HomeView = () => {
  const { user, showToast, refreshNotifications } = useApp();
  const { t } = useTranslation();
  const key = JSON.stringify([user?.id, user?.favoritePlayerIds, user?.favoriteTeamIds, user?.favoriteMatchIds, user?.favoriteTournamentIds, user?.preferences]);
  const { data, loading, error, refresh } = useResource<DashboardData | null>(key, dashboardService.get, null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  return <ListPageLayout>
    <PageHeader title={t('dashboard.title', { name: user?.name ?? '' })} description={t('dashboard.description')} actions={<button type="button" disabled={loading} onClick={refresh} className="min-h-11 rounded-xl border border-pitch-line bg-white px-4 text-sm font-bold disabled:opacity-50">{t('list.refresh')}</button>} />
    <ListError error={error} onRetry={refresh} />
    {loading && !data && <CardSkeleton />}
    {data && <>
      <section className="dashboard-hero relative isolate overflow-hidden rounded-3xl bg-pitch-ink p-6 text-white sm:p-8">
        <FootballPitch />
        <div className="relative z-10 grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="card-title text-xs font-bold uppercase text-lime-volt">{t('settings.team')}</h2>
            {data.myTeam ? <>
              <Link to={'/teams/' + encodeURIComponent(data.myTeam.id)} className="flex items-center gap-3 text-xl font-extrabold">{data.myTeam.logoUrl && <img src={data.myTeam.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />} {data.myTeam.name}</Link>
              <p className="text-sm text-slate-300">{data.myTeam.division} · {data.myTeam.city} · {t('home.members', { count: data.myTeam.membersCount })}</p>
              <div className="flex flex-wrap gap-2"><Link to={'/teams/' + encodeURIComponent(data.myTeam.id)} className="rounded-xl border border-white/20 px-4 py-3 text-sm">{t('home.roster')}</Link>
                {data.canManageTeam && <button type="button" onClick={() => setReminderOpen(true)} className="rounded-xl bg-lime-volt px-4 py-3 text-sm font-bold text-pitch-ink">{t('home.relaunch')}</button>}</div>
            </> : <Link to="/teams" className="block text-sm text-slate-200 underline">{t('dashboard.noTeam')}</Link>}
          </div>
          <div className="space-y-3"><h2 className="card-title text-xs font-bold text-lime-volt">{t('home.nextMatch')}</h2>
            {data.nextTeamMatch ? <div className="rounded-2xl bg-white text-pitch-ink"><DashboardMatchCard match={data.nextTeamMatch} /></div> : <p className="text-sm text-slate-300">{t('dashboard.noMatch')}</p>}
            <Link to="/matches" className="inline-block text-sm underline">{t('home.fullSchedule')}</Link>
          </div>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">{([
        ['dashboard.applications', '/settings/applications', data.pendingActions.applications],
        ['dashboard.bookings', '/settings/bookings', data.pendingActions.bookings],
        ['dashboard.roles', '/settings/roles', data.pendingActions.roles],
      ] as const).map(([label, href, count]) => <Link key={href} to={href} className="flex items-center justify-between rounded-2xl border border-pitch-line bg-white p-4 text-sm font-bold">{t(label)}<span className="rounded-full bg-pitch-light px-3 py-1">{count}</span></Link>)}</div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DashboardSection title={t('dashboard.matches')} href="/matches?favorites=true" empty={!data.followedMatches.length}><div className="space-y-3">{data.followedMatches.map((match) => <DashboardMatchCard key={match.id} match={match} />)}</div></DashboardSection>
        <DashboardSection title={t('dashboard.teams')} href="/teams?favorites=true" empty={!data.favoriteTeams.length}><div className="grid gap-3 sm:grid-cols-2">{data.favoriteTeams.map((team) => <Link key={team.id} to={'/teams/' + encodeURIComponent(team.id)} className="flex items-center gap-3 rounded-xl border border-pitch-line p-3 text-sm font-bold">{team.logoUrl && <img src={team.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />}{team.name}</Link>)}</div></DashboardSection>
        <DashboardSection title={t('dashboard.players')} href="/players?favorites=true" empty={!data.favoritePlayers.length}><div className="grid gap-3 sm:grid-cols-2">{data.favoritePlayers.map((player) => <Link key={player.id} to={'/profile/' + encodeURIComponent(player.id)} className="flex items-center gap-3 rounded-xl border border-pitch-line p-3">{player.avatarUrl && <img src={player.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />}<span><strong className="block text-sm">{player.name}</strong><span className="text-xs text-slate-500">{player.primaryPosition} · {player.currentTeam}</span></span></Link>)}</div></DashboardSection>
        <DashboardSection title={t('dashboard.tournaments')} href="/tournaments?favorites=true" empty={!data.favoriteTournaments.length}>{data.favoriteTournaments.map((tournament) => <Link key={tournament.id} to={'/tournaments/' + encodeURIComponent(tournament.id)} className="block rounded-xl border border-pitch-line p-3 text-sm font-bold">{tournament.title}<span className="block text-xs font-normal text-slate-500">{tournament.city} · {tournament.startDate}</span></Link>)}</DashboardSection>
        <DashboardSection title={t('dashboard.bookings')} href="/settings/bookings" empty={!data.bookings.length}>{data.bookings.map((booking) => <Link key={booking.id} to={'/settings/bookings/' + encodeURIComponent(booking.id)} className="block border-b border-pitch-line py-3 text-sm"><strong>{booking.pitchName}</strong><span className="block text-xs text-slate-500">{booking.date} · {booking.time} · {booking.status}</span></Link>)}</DashboardSection>
        <DashboardSection title={t('dashboard.applications')} href="/settings/applications" empty={!data.applications.length}>{data.applications.map((application) => <Link key={application.id} to={'/mercato/' + encodeURIComponent(application.adId)} className="block border-b border-pitch-line py-3 text-sm"><strong>{application.title} · {application.teamName}</strong><span className="block text-xs text-slate-500">{application.status}</span></Link>)}</DashboardSection>
        {user?.preferences?.showPersonalActivity !== false && <DashboardSection title={t('dashboard.personal')} href="/notifications" empty={!data.personalActivity.length}><ActivityList items={data.personalActivity} /></DashboardSection>}
        <DashboardSection title={t('dashboard.platform')} empty={!data.platformActivity.length}><ActivityList items={data.platformActivity} /></DashboardSection>
      </div>
      <Link to="/stats" className="inline-block text-sm font-bold text-pitch-primary underline">{t('home.standings')} · {t('nav.stats')}</Link>
    </>}
    {reminderOpen && data?.myTeam && <Modal isOpen onClose={() => setReminderOpen(false)} title={t('home.relaunchTitle', { team: data.myTeam.name })}>
      <form onSubmit={async (event) => {
        event.preventDefault(); if (!data.myTeam || sending) return; setSending(true);
        try { await teamsService.remindMembers(data.myTeam.id, message); setReminderOpen(false); setMessage(''); showToast(t('home.relaunchSent')); await refreshNotifications(); refresh(); }
        catch (reason) { showToast(reason instanceof Error ? reason.message : t('matches.loadError'), 'error'); }
        finally { setSending(false); }
      }} className="space-y-4"><label className="block text-sm font-bold">{t('home.relaunchInstruction')}<textarea required maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-pitch-line p-3 font-normal" /></label><button type="submit" disabled={sending || !message.trim()} className="min-h-11 rounded-xl bg-pitch-primary px-4 text-white disabled:opacity-50">{sending ? t('home.sending') : t('home.send')}</button></form>
    </Modal>}
  </ListPageLayout>;
};
