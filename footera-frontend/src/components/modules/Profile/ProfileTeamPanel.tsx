import { useEffect, useState } from 'react';
import { Check, Search, ShieldCheck, UserRoundMinus, Users, X } from 'lucide-react';
import { useApp } from '../../../context/useApp';
import { useTranslation } from '../../../i18n';
import { teamsService, type TeamJoinRequest } from '../../../services/teamsService';
import { catalogsService } from '../../../services/catalogsService';
import type { Team } from '../../../types';
import { EntityLink } from '../../common/EntityLink';
import { SelectField } from '../../common/SelectField';

interface ProfileTeamPanelProps {
  currentTeamId?: string;
  currentTeamName?: string;
}

export function ProfileTeamPanel({ currentTeamId, currentTeamName }: ProfileTeamPanelProps) {
  const { t } = useTranslation();
  const { showToast } = useApp();
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [myRequests, setMyRequests] = useState<TeamJoinRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<TeamJoinRequest[]>([]);
  const [managedTeam, setManagedTeam] = useState<Team | null>(null);
  const [activeTeamId, setActiveTeamId] = useState(currentTeamId ?? '');
  const [activeTeamName, setActiveTeamName] = useState(currentTeamName ?? '');
  const [pendingActionId, setPendingActionId] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [editingRequest, setEditingRequest] = useState<TeamJoinRequest | null>(null);
  const [editPosition, setEditPosition] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [newRequestTeamId, setNewRequestTeamId] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    let active = true;
    catalogsService.getOptions().then((options) => { if (active) setPositionOptions(options.recruitmentPositions); })
      .catch((error: unknown) => { if (active) showToast(error instanceof Error ? error.message : t('common.loadOptionsError'), 'error'); });
    return () => { active = false; };
  }, [showToast, t]);

  useEffect(() => {
    setActiveTeamId(currentTeamId ?? '');
    setActiveTeamName(currentTeamName ?? '');
  }, [currentTeamId, currentTeamName]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setIsLoadingTeams(true);
      teamsService.list({ query: query.trim() || undefined })
        .then((result) => { if (active) setTeams(result); })
        .catch((error: unknown) => { if (active) showToast(error instanceof Error ? error.message : t('profile.teamsLoadError'), 'error'); })
        .finally(() => { if (active) setIsLoadingTeams(false); });
    }, query ? 250 : 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [query, showToast, t]);

  useEffect(() => {
    let active = true;
    Promise.all([teamsService.listMyJoinRequests(), teamsService.getMyTeam()])
      .then(async ([requests, team]) => {
        if (!active) return;
        setMyRequests(requests);
        setManagedTeam(team);
        if (team) {
          const received = await teamsService.listMyTeamJoinRequests();
          if (active) setIncomingRequests(received.filter((request) => request.status === 'PENDING'));
        }
      })
      .catch((error: unknown) => { if (active) showToast(error instanceof Error ? error.message : t('profile.teamRequestsLoadError'), 'error'); })
      .finally(() => { if (active) setIsLoadingRequests(false); });
    return () => { active = false; };
  }, [showToast, t]);

  const requestToJoin = async (team: Team) => {
    if (pendingActionId || activeTeamId || activeTeamName) return;
    setNewRequestTeamId((current) => current === team.id ? '' : team.id);
    setNewPosition('');
    setNewMessage('');
  };

  const sendJoinRequest = async (team: Team) => {
    if (pendingActionId || activeTeamId || activeTeamName || !newPosition || !newMessage.trim()) return;
    setPendingActionId(team.id);
    try {
      const result = await teamsService.joinTeam(team.id, newMessage, newPosition);
      const requests = await teamsService.listMyJoinRequests();
      setMyRequests(requests);
      setNewRequestTeamId('');
      showToast(result.message, 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('profile.teamJoinError'), 'error');
    } finally {
      setPendingActionId('');
    }
  };

  const respondToRequest = async (request: TeamJoinRequest, accept: boolean) => {
    if (pendingActionId) return;
    setPendingActionId(request.id);
    try {
      await teamsService.respondToJoinRequest(request.id, accept);
      setIncomingRequests((current) => current.filter((item) => item.id !== request.id));
      showToast(t(accept ? 'profile.teamRequestAccepted' : 'profile.teamRequestDeclined'), 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('profile.teamRequestActionError'), 'error');
    } finally {
      setPendingActionId('');
    }
  };

  const cancelMyRequest = async (request: TeamJoinRequest) => {
    if (pendingActionId) return;
    setPendingActionId(request.id);
    try {
      await teamsService.cancelMyJoinRequest(request.id);
      setMyRequests((current) => current.filter((item) => item.id !== request.id));
      showToast(t('profile.teamRequestCancelled'));
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('profile.teamRequestCancelError'), 'error');
    } finally { setPendingActionId(''); }
  };

  const saveMyRequest = async () => {
    if (!editingRequest || pendingActionId) return;
    setPendingActionId(editingRequest.id);
    try {
      await teamsService.updateMyJoinRequest(editingRequest.id, editMessage, editPosition);
      const requests = await teamsService.listMyJoinRequests();
      setMyRequests(requests);
      setEditingRequest(null);
      showToast(t('profile.teamRequestUpdated'));
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('profile.teamRequestEditError'), 'error');
    } finally { setPendingActionId(''); }
  };

  const leaveTeam = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      const result = await teamsService.leaveCurrentTeam();
      setActiveTeamId('');
      setActiveTeamName('');
      setConfirmLeave(false);
      showToast(t('profile.teamLeft', { team: result.teamName }), 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('profile.teamLeaveError'), 'error');
    } finally {
      setIsLeaving(false);
    }
  };

  const isCurrentTeam = (team: Team) => team.id === activeTeamId || Boolean(activeTeamName && team.name.toLocaleLowerCase() === activeTeamName.toLocaleLowerCase());
  const pendingTeamIds = new Set(myRequests.filter((request) => request.status === 'PENDING').map((request) => request.teamId));

  return <section className="overflow-hidden rounded-3xl border border-pitch-line bg-white shadow-xs">
    <header className="flex items-start gap-3 border-b border-pitch-line bg-pitch-panel/70 p-5 md:p-6">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-pitch-primary shadow-xs"><Users className="h-5 w-5" aria-hidden="true" /></span>
      <div className="min-w-0"><h2 className="card-title text-lg font-extrabold text-pitch-ink">{t('profile.teamDiscoveryTitle')}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{t('profile.teamDiscoveryDescription')}</p></div>
    </header>

    {(activeTeamId || activeTeamName) && <div className="mx-5 mt-5 flex flex-col gap-3 rounded-2xl border border-pitch-line bg-pitch-light/60 p-4 sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-pitch-primary">{t('profile.currentTeamLabel')}</p><p className="mt-1 truncate font-bold text-pitch-ink">{activeTeamName || teams.find((team) => team.id === activeTeamId)?.name || t('profile.currentTeamFallback')}</p></div>
      {!confirmLeave ? <button type="button" onClick={() => setConfirmLeave(true)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50"><UserRoundMinus className="h-4 w-4" aria-hidden="true" />{t('profile.leaveTeam')}</button> : <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setConfirmLeave(false)} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-pitch-line bg-white px-3 py-2 text-sm font-semibold text-slate-700"><X className="h-4 w-4" aria-hidden="true" />{t('common.cancel')}</button>
        <button type="button" onClick={() => void leaveTeam()} disabled={isLeaving} className="min-h-10 rounded-xl bg-rose-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{isLeaving ? t('profile.leavingTeam') : t('profile.confirmLeaveTeam')}</button>
      </div>}
    </div>}

    <div className="p-5 md:p-6">
      <label htmlFor="profile-team-search" className="sr-only">{t('profile.searchTeams')}</label>
      <div className="flex items-center gap-2 rounded-2xl border border-pitch-line bg-pitch-panel px-3 focus-within:border-pitch-primary focus-within:ring-2 focus-within:ring-pitch-primary/15">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <input id="profile-team-search" name="teamSearch" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('profile.searchTeams')} className="min-h-11 w-full min-w-0 bg-transparent text-sm text-pitch-ink outline-hidden placeholder:text-slate-400" />
      </div>

      {isLoadingTeams ? <p className="py-8 text-center text-sm text-slate-500">{t('common.loading')}</p> : teams.length === 0 ? <p className="mt-4 rounded-2xl bg-pitch-panel p-4 text-sm text-slate-500">{t('profile.noTeamsFound')}</p> : <ul className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">{teams.map((team) => {
        const isCurrent = isCurrentTeam(team);
        const isPending = pendingTeamIds.has(team.id);
        return <li key={team.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-pitch-line p-3 sm:p-4">
          <img src={team.logoUrl} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl border border-pitch-line bg-pitch-panel object-cover" />
          <div className="min-w-0 flex-1"><EntityLink section="teams" id={team.id} className="block truncate font-bold text-pitch-ink hover:text-pitch-primary">{team.name}</EntityLink><p className="truncate text-xs text-slate-500">{team.city} · {t('profile.teamMembersCount', { count: team.membersCount })}</p></div>
          {isCurrent ? <span className="shrink-0 rounded-full bg-pitch-light px-2.5 py-1 text-xs font-bold text-pitch-primary">{t('profile.currentTeamBadge')}</span> : isPending ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{t('profile.teamRequestPending')}</span>{(() => { const request = myRequests.find((item) => item.teamId === team.id && item.status === 'PENDING'); return request ? <><button type="button" onClick={() => { setEditingRequest(editingRequest?.id === request.id ? null : request); setEditPosition(request.position); setEditMessage(request.message); }} className="min-h-9 rounded-lg bg-white px-2 py-1 text-xs font-bold text-pitch-ink">{t('profile.editTeamRequest')}</button><button type="button" onClick={() => void cancelMyRequest(request)} disabled={Boolean(pendingActionId)} className="min-h-9 rounded-lg px-2 py-1 text-xs font-bold text-rose-700 disabled:opacity-50">{t('profile.cancelTeamRequest')}</button></> : null; })()}</div> : <button type="button" onClick={() => void requestToJoin(team)} disabled={Boolean(activeTeamId || activeTeamName || pendingActionId)} className="min-h-10 shrink-0 rounded-xl bg-pitch-action px-3 py-2 text-xs font-bold text-white hover:bg-pitch-action-hover disabled:cursor-not-allowed disabled:opacity-50">{pendingActionId === team.id ? t('profile.teamRequestSending') : t('profile.requestToJoin')}</button>}
          {editingRequest?.teamId === team.id && <div className="w-full space-y-2"><SelectField required value={editPosition} onChange={(event) => setEditPosition(event.target.value)} className="min-h-10 w-full rounded-xl border border-pitch-line bg-white px-3 text-xs text-pitch-ink">{positionOptions.map((position) => <option key={position} value={position}>{position}</option>)}</SelectField><textarea value={editMessage} onChange={(event) => setEditMessage(event.target.value)} rows={3} className="w-full rounded-xl border border-pitch-line bg-white p-3 text-xs text-pitch-ink" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingRequest(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600">{t('common.cancel')}</button><button type="button" onClick={() => void saveMyRequest()} disabled={!editPosition || !editMessage.trim() || Boolean(pendingActionId)} className="rounded-lg bg-pitch-action px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{t('common.save')}</button></div></div>}
          {newRequestTeamId === team.id && <div className="w-full space-y-2"><label className="block text-xs font-bold text-slate-700">{t('teams.joinPosition')}</label><SelectField required value={newPosition} onChange={(event) => setNewPosition(event.target.value)} className="min-h-10 w-full rounded-xl border border-pitch-line bg-white px-3 text-xs text-pitch-ink"><option value="" disabled>{t('teams.joinPositionPlaceholder')}</option>{positionOptions.map((position) => <option key={position} value={position}>{position}</option>)}</SelectField><label className="block text-xs font-bold text-slate-700">{t('teams.joinMessage')}</label><textarea value={newMessage} onChange={(event) => setNewMessage(event.target.value)} rows={3} placeholder={t('teams.joinMessagePlaceholder')} className="w-full rounded-xl border border-pitch-line bg-white p-3 text-xs text-pitch-ink" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setNewRequestTeamId('')} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600">{t('common.cancel')}</button><button type="button" onClick={() => void sendJoinRequest(team)} disabled={!newPosition || !newMessage.trim() || Boolean(pendingActionId)} className="rounded-lg bg-pitch-action px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{pendingActionId === team.id ? t('profile.teamRequestSending') : t('teams.joinSubmit')}</button></div></div>}
        </li>;
      })}</ul>}
    </div>

    {managedTeam && <div className="border-t border-pitch-line p-5 md:p-6">
      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-pitch-primary" aria-hidden="true" /><h3 className="card-title font-bold text-pitch-ink">{t('profile.teamRequestsInbox', { team: managedTeam.name })}</h3></div>
      {isLoadingRequests ? <p className="mt-3 text-sm text-slate-500">{t('common.loading')}</p> : incomingRequests.length === 0 ? <p className="mt-3 text-sm text-slate-500">{t('profile.noPendingTeamRequests')}</p> : <ul className="mt-3 space-y-3">{incomingRequests.map((request) => <li key={request.id} className="flex min-w-0 flex-col gap-3 rounded-2xl bg-pitch-panel p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><EntityLink section="players" id={request.playerId} className="font-bold text-pitch-ink hover:text-pitch-primary">{request.playerName}</EntityLink><p className="mt-1 break-words text-sm text-slate-600">{request.message}</p></div>
        <div className="flex shrink-0 gap-2"><button type="button" onClick={() => void respondToRequest(request, true)} disabled={Boolean(pendingActionId)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-pitch-action px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" aria-hidden="true" />{t('profile.acceptTeamRequest')}</button><button type="button" onClick={() => void respondToRequest(request, false)} disabled={Boolean(pendingActionId)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-pitch-line bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"><X className="h-4 w-4" aria-hidden="true" />{t('profile.declineTeamRequest')}</button></div>
      </li>)}</ul>}
    </div>}
  </section>;
}
