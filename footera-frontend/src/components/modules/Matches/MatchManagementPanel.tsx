import React, { useEffect, useState } from 'react';
import { Plus, Save, Shield, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { matchesService } from '../../../services/matchesService';
import { playersService } from '../../../services/playersService';
import type { Match, MatchEvent, MatchEventInput, Player } from '../../../types';
import { useApp } from '../../../context/useApp';

type EditableEventType = 'goal' | 'penalty' | 'yellow_card' | 'red_card' | 'sub';

interface EventDraft {
  key: string;
  minute: string;
  type: EditableEventType;
  teamId: string;
  playerId: string;
  substitutedPlayerId: string;
  assistPlayerId: string;
  description: string;
}

interface MatchManagementPanelProps {
  match: Match;
  onMatchUpdated: (match: Match) => void;
}

function toEventDraft(event: MatchEvent, index: number): EventDraft {
  const supportedType: EditableEventType = ['goal', 'penalty', 'yellow_card', 'red_card', 'sub'].includes(event.type)
    ? event.type as EditableEventType
    : 'goal';
  return {
    key: `${event.teamId}-${event.minute}-${index}`,
    minute: String(event.minute),
    type: supportedType,
    teamId: event.teamId,
    playerId: event.playerId,
    substitutedPlayerId: event.substitutedPlayerId ?? '',
    assistPlayerId: event.assistPlayerId ?? '',
    description: event.description ?? '',
  };
}

export const MatchManagementPanel: React.FC<MatchManagementPanelProps> = ({ match, onMatchUpdated }) => {
  const { t } = useTranslation();
  const { showToast } = useApp();
  const [players, setPlayers] = useState<Player[]>([]);
  const [date, setDate] = useState(match.scheduledAt?.slice(0, 10)
    ?? (/^\d{4}-\d{2}-\d{2}$/.test(match.date) ? match.date : ''));
  const [time, setTime] = useState(match.time);
  const [venue, setVenue] = useState(match.venue);
  const [events, setEvents] = useState<EventDraft[]>(match.events.map(toEventDraft));
  const [lineups, setLineups] = useState<Record<string, string[]>>(() => Object.fromEntries(
    [match.homeTeam.id, match.awayTeam.id].map((teamId) => [teamId, match.lineups?.find((lineup) => lineup.teamId === teamId)?.playerIds ?? []]),
  ));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    playersService.list().then((items) => {
      if (active) setPlayers(items);
    }).catch((error: unknown) => {
      if (active) showToast(error instanceof Error ? error.message : t('matches.noEligiblePlayers'), 'error');
    });
    return () => { active = false; };
  }, [showToast, t]);

  useEffect(() => {
    setDate(match.scheduledAt?.slice(0, 10) ?? (/^\d{4}-\d{2}-\d{2}$/.test(match.date) ? match.date : ''));
    setTime(match.time);
    setVenue(match.venue);
    setEvents(match.events.map(toEventDraft));
    setLineups(Object.fromEntries(
      [match.homeTeam.id, match.awayTeam.id].map((teamId) => [teamId, match.lineups?.find((lineup) => lineup.teamId === teamId)?.playerIds ?? []]),
    ));
  }, [match]);

  const updateEvent = (key: string, updates: Partial<EventDraft>) => {
    setEvents((current) => current.map((event) => event.key === key ? { ...event, ...updates } : event));
  };

  const handleStart = async () => {
    try {
      onMatchUpdated(await matchesService.start(match.id));
      showToast(t('matches.started'));
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('matches.startError'), 'error');
    }
  };

  const handleFinish = async () => {
    if (!window.confirm(t('matches.confirmFinish'))) return;
    try {
      onMatchUpdated(await matchesService.finish(match.id));
      showToast(t('matches.finished'));
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('matches.finishError'), 'error');
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payloadEvents: MatchEventInput[] = events.map((item) => ({
      minute: Number(item.minute),
      type: item.type,
      teamId: item.teamId,
      playerId: item.playerId,
      ...(item.type === 'sub' && item.substitutedPlayerId ? { substitutedPlayerId: item.substitutedPlayerId } : {}),
      ...(item.assistPlayerId ? { assistPlayerId: item.assistPlayerId } : {}),
      ...(item.description.trim() ? { description: item.description.trim() } : {}),
    }));
    setIsSaving(true);
    try {
      const updated = await matchesService.update(match.id, {
        date, time, venue, events: payloadEvents,
        lineups: [match.homeTeam.id, match.awayTeam.id].map((teamId) => ({ teamId, playerIds: lineups[teamId] ?? [] })),
      });
      onMatchUpdated(updated);
      setIsEditing(false);
      showToast(t('matches.saved'));
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('matches.updateError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const eventTypeLabel = (type: EditableEventType) => ({
    goal: t('matches.goal'), penalty: t('matches.penalty'), yellow_card: t('matches.yellow'),
    red_card: t('matches.red'), sub: t('matches.substitution'),
  })[type];

  return (
    <section className="space-y-3 rounded-2xl border border-pitch-line bg-pitch-panel p-4" aria-label={t('matches.manageTitle')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="card-title flex items-center gap-2 text-sm font-bold text-pitch-ink">
          <Shield className="h-4 w-4 text-pitch-primary" />{t('matches.manageTitle')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {match.status === 'SCHEDULED' && (
            <button type="button" onClick={handleStart} className="min-h-10 rounded-xl bg-pitch-primary px-3 text-xs font-bold text-white hover:bg-pitch-hover">
              {t('matches.start')}
            </button>
          )}
          {match.status === 'LIVE' && (
            <button type="button" onClick={handleFinish} className="min-h-10 rounded-xl bg-pitch-ink px-3 text-xs font-bold text-white">
              {t('matches.finish')}
            </button>
          )}
          {match.status !== 'FINISHED' && (
            <button type="button" onClick={() => setIsEditing((value) => !value)} className="min-h-10 rounded-xl border border-pitch-line bg-white px-3 text-xs font-bold text-pitch-ink hover:border-pitch-primary">
              {isEditing ? t('common.cancel') : t('matches.edit')}
            </button>
          )}
        </div>
      </div>

      {isEditing && match.status !== 'FINISHED' && (
        <form onSubmit={handleSave} className="space-y-4 border-t border-pitch-line pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              <span>{t('matches.date')}</span>
              <input id="match-edit-date" name="date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 w-full rounded-xl border border-pitch-line bg-white px-3 text-pitch-ink" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              <span>{t('matches.time')}</span>
              <input id="match-edit-time" name="time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="min-h-11 w-full rounded-xl border border-pitch-line bg-white px-3 text-pitch-ink" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
              <span>{t('matches.venue')}</span>
              <input id="match-edit-venue" name="venue" required maxLength={200} value={venue} onChange={(event) => setVenue(event.target.value)} className="min-h-11 w-full rounded-xl border border-pitch-line bg-white px-3 text-pitch-ink" />
            </label>
          </div>

          <section className="space-y-3">
            <div>
              <h4 className="text-xs font-bold text-pitch-ink">{t('matches.lineups')}</h4>
              <p className="mt-1 text-xs text-slate-500">{t('matches.selectStartingPlayers')}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[match.homeTeam, match.awayTeam].map((team) => {
                const teamPlayers = players.filter((player) => player.currentTeamId === team.id);
                const selectedIds = lineups[team.id] ?? [];
                return (
                  <fieldset key={team.id} className="min-w-0 space-y-2 rounded-xl border border-pitch-line bg-white p-3">
                    <legend className="px-1 text-xs font-bold text-pitch-ink">{team.name}</legend>
                    {teamPlayers.length ? (
                      <div className="max-h-48 space-y-1 overflow-y-auto">
                        {teamPlayers.map((player) => {
                          const checked = selectedIds.includes(player.id);
                          return (
                            <label key={player.id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs text-pitch-ink hover:bg-pitch-panel">
                              <input
                                type="checkbox"
                                name={`lineup-${team.id}`}
                                value={player.id}
                                checked={checked}
                                disabled={!checked && selectedIds.length >= 30}
                                onChange={() => setLineups((current) => ({
                                  ...current,
                                  [team.id]: checked ? selectedIds.filter((id) => id !== player.id) : [...selectedIds, player.id],
                                }))}
                                className="h-4 w-4 accent-pitch-primary"
                              />
                              <span className="truncate">{player.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : <p className="text-xs text-slate-500">{t('matches.noEligiblePlayers')}</p>}
                  </fieldset>
                );
              })}
            </div>
          </section>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-pitch-ink">{t('matches.events')}</h4>
              <button
                type="button"
                onClick={() => setEvents((current) => [...current, {
                  key: `new-${Date.now()}-${current.length}`, minute: '', type: 'goal', teamId: match.homeTeam.id,
                  playerId: '', substitutedPlayerId: '', assistPlayerId: '', description: '',
                }])}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-pitch-line bg-white px-3 text-xs font-semibold text-pitch-primary"
              >
                <Plus className="h-4 w-4" />{t('matches.addEvent')}
              </button>
            </div>
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {events.map((item) => {
                const teamPlayers = players.filter((player) => player.currentTeamId === item.teamId);
                const supportsAssist = item.type === 'goal' || item.type === 'penalty';
                return (
                  <fieldset key={item.key} className="grid grid-cols-1 gap-2 rounded-xl border border-pitch-line bg-white p-3 sm:grid-cols-2">
                    <legend className="sr-only">{t('matches.events')}</legend>
                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>{t('matches.minute')}</span>
                      <input id={`event-minute-${item.key}`} name={`event-minute-${item.key}`} type="number" min="0" max="130" required value={item.minute} onChange={(event) => updateEvent(item.key, { minute: event.target.value })} className="min-h-10 w-full rounded-lg border border-pitch-line px-2 text-pitch-ink" />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>{t('matches.type')}</span>
                      <select id={`event-type-${item.key}`} name={`event-type-${item.key}`} value={item.type} onChange={(event) => updateEvent(item.key, { type: event.target.value as EditableEventType, assistPlayerId: '' })} className="min-h-10 w-full rounded-lg border border-pitch-line bg-white px-2 text-pitch-ink">
                        {(['goal', 'penalty', 'yellow_card', 'red_card', 'sub'] as const).map((type) => <option key={type} value={type}>{eventTypeLabel(type)}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>{t('matches.team')}</span>
                      <select id={`event-team-${item.key}`} name={`event-team-${item.key}`} value={item.teamId} onChange={(event) => updateEvent(item.key, { teamId: event.target.value, playerId: '', assistPlayerId: '' })} className="min-h-10 w-full rounded-lg border border-pitch-line bg-white px-2 text-pitch-ink">
                        <option value={match.homeTeam.id}>{match.homeTeam.name}</option>
                        <option value={match.awayTeam.id}>{match.awayTeam.name}</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>{t('matches.player')}</span>
                      <select id={`event-player-${item.key}`} name={`event-player-${item.key}`} required value={item.playerId} onChange={(event) => updateEvent(item.key, { playerId: event.target.value, assistPlayerId: event.target.value === item.assistPlayerId ? '' : item.assistPlayerId })} className="min-h-10 w-full rounded-lg border border-pitch-line bg-white px-2 text-pitch-ink">
                        <option value="">{teamPlayers.length ? t('matches.selectPlayer') : t('matches.noEligiblePlayers')}</option>
                        {teamPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                      </select>
                    </label>
                    {supportsAssist && (
                      <label className="space-y-1 text-xs font-semibold text-slate-700">
                        <span>{t('matches.assist')}</span>
                        <select id={`event-assist-${item.key}`} name={`event-assist-${item.key}`} value={item.assistPlayerId} onChange={(event) => updateEvent(item.key, { assistPlayerId: event.target.value })} className="min-h-10 w-full rounded-lg border border-pitch-line bg-white px-2 text-pitch-ink">
                          <option value="">{t('matches.noAssist')}</option>
                          {teamPlayers.filter((player) => player.id !== item.playerId).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                        </select>
                      </label>
                    )}
                    {item.type === 'sub' && (
                      <label className="space-y-1 text-xs font-semibold text-slate-700">
                        <span>{t('matches.playerReplaced')}</span>
                        <select id={`event-substituted-player-${item.key}`} name={`event-substituted-player-${item.key}`} required value={item.substitutedPlayerId} onChange={(event) => updateEvent(item.key, { substitutedPlayerId: event.target.value })} className="min-h-10 w-full rounded-lg border border-pitch-line bg-white px-2 text-pitch-ink">
                          <option value="">{t('matches.selectPlayer')}</option>
                          {teamPlayers.filter((player) => player.id !== item.playerId).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                        </select>
                      </label>
                    )}
                    <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
                      <span>{t('matches.description')}</span>
                      <input id={`event-description-${item.key}`} name={`event-description-${item.key}`} maxLength={300} value={item.description} onChange={(event) => updateEvent(item.key, { description: event.target.value })} className="min-h-10 w-full rounded-lg border border-pitch-line px-2 text-pitch-ink" />
                    </label>
                    <button type="button" onClick={() => setEvents((current) => current.filter((event) => event.key !== item.key))} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-red-700 sm:col-span-2 sm:justify-self-end">
                      <Trash2 className="h-4 w-4" />{t('matches.removeEvent')}
                    </button>
                  </fieldset>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={isSaving || !date || !time || !venue.trim()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-pitch-primary px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            <Save className="h-4 w-4" />{isSaving ? t('matches.saving') : t('matches.save')}
          </button>
        </form>
      )}
    </section>
  );
};
