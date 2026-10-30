import { Building2,Shield,Sparkles,Target } from 'lucide-react';
import { Tournament } from '../../../types';
import { formatDateForDisplay,getTodayDateInputValue } from '../../../utils/date';
import { DatePickerField } from '../../common/DatePickerField';
import { EntityLink } from '../../common/EntityLink';
import { FavoriteButton } from '../../common/FavoriteButton';
import { ImageUploadField } from '../../common/ImageUploadField';
import { Modal } from '../../common/Modal';
import { PhotoGallery } from '../../common/PhotoGallery';
import { SelectField } from '../../common/SelectField';

const TOURNAMENT_BANNER_PRESETS = [
  {
    name: 'night',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'final',
    url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'futsal',
    url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'cup',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80',
  },
] as const;

import type { useTournamentsViewModel } from './useTournamentsViewModel';

export function TournamentsDialogs({ model }: { model: ReturnType<typeof useTournamentsViewModel> }) {
  const { user, t, tournamentModal, status, catalogOptions, selectedTournament, setSelectedTournament, tournModalTab, setTournModalTab, tournScorers, tournAssisters, isRegisterOpen, setIsRegisterOpen, registerTeamId, setRegisterTeamId, teams, ownedPitches, tournamentTeams, tournamentStadiums, isSubmitting, formTitle, setFormTitle, formFormat, setFormFormat, formCity, setFormCity, setFormVenue, formPitchIds, setFormPitchIds, formStartDate, setFormStartDate, formEndDate, setFormEndDate, formMaxTeams, setFormMaxTeams, formEntryFee, setFormEntryFee, formPrizePool, setFormPrizePool, formOrganizer, setFormOrganizer, formBannerUrl, setFormBannerUrl, isCreating, canCreateTournament, handleRegister, handleCreateTournament } = model;
  return <>
      {/* Tournament Details Modal */}
      {selectedTournament && (
        <Modal
          isOpen={!!selectedTournament}
          onClose={() => {
            setSelectedTournament(null);
            tournamentModal.close();
          }}
          title={selectedTournament.title}
          subtitle={`${selectedTournament.format} · ${selectedTournament.venue} (${selectedTournament.city})`}
          maxWidth="xl"
        >
          <div className="space-y-6">
            <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={selectedTournament.bannerUrl}
                alt={selectedTournament.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs font-bold text-lime-volt uppercase tracking-wider block">
                  Organisé par {selectedTournament.organizer}
                </span>
                <h2 className="card-title text-xl font-extrabold">{selectedTournament.title}</h2>
                <FavoriteButton entity="tournaments" id={selectedTournament.id} />
              </div>
            </div>
            <PhotoGallery entity="tournaments" id={selectedTournament.id} />

            {/* Tournament Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-pitch-panel border border-pitch-line rounded-2xl">
              <button
                type="button"
                onClick={() => setTournModalTab('overview')}
                className={`flex-1 min-w-24 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tournModalTab === 'overview'
                    ? 'bg-pitch-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-pitch-ink'
                }`}
              >
                Aperçu & Inscription
              </button>
              <button
                type="button"
                onClick={() => setTournModalTab('teams')}
                className={`flex-1 min-w-20 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tournModalTab === 'teams' ? 'bg-pitch-primary text-white shadow-xs' : 'text-slate-600 hover:text-pitch-ink'}`}
              >
                Équipes ({selectedTournament.participatingTeams?.length ?? selectedTournament.registeredTeams})
              </button>
              <button
                type="button"
                onClick={() => setTournModalTab('stadiums')}
                className={`flex-1 min-w-20 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tournModalTab === 'stadiums' ? 'bg-pitch-primary text-white shadow-xs' : 'text-slate-600 hover:text-pitch-ink'}`}
              >
                Stades ({selectedTournament.stadiums?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setTournModalTab('scorers')}
                  className={`flex-1 min-w-24 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  tournModalTab === 'scorers'
                    ? 'bg-pitch-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-pitch-ink'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>{t('tournaments.scorersTab', { count: tournScorers.length })}</span>
              </button>
              <button
                type="button"
                onClick={() => setTournModalTab('assists')}
                  className={`flex-1 min-w-24 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  tournModalTab === 'assists'
                    ? 'bg-pitch-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-pitch-ink'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('tournaments.assistersTab', { count: tournAssisters.length })}</span>
              </button>
            </div>

            {tournModalTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3.5 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-slate-500 text-caption block">{t('tournaments.prizePoolLabel')}</span>
                    <strong className="text-pitch-primary text-base font-extrabold tabular-nums">
                      {selectedTournament.prizePool.toLocaleString()} €
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-slate-500 text-caption block">{t('tournaments.feeLabel')}</span>
                    <strong className="text-pitch-ink text-base font-extrabold tabular-nums">
                      {selectedTournament.entryFee} €
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-slate-500 text-caption block">{t('tournaments.places')}</span>
                    <strong className="text-[#059669] text-base font-extrabold tabular-nums">
                      {selectedTournament.remainingTeams ?? 0} restantes
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-pitch-panel border border-border-subtle space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">{t('tournaments.datesLabel')}</span>
                    <span className="font-bold text-pitch-ink">{formatDateForDisplay(selectedTournament.startDate)} au {formatDateForDisplay(selectedTournament.endDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">{t('tournaments.venueLabel')}</span>
                    <span className="font-bold text-pitch-ink">{selectedTournament.venue}, {selectedTournament.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">{t('tournaments.formatLabel')}</span>
                    <span className="font-bold text-pitch-primary">{selectedTournament.format}</span>
                  </div>
                </div>

                {selectedTournament.registrationOpen !== false && selectedTournament.status === 'INSCRIPTIONS_OUVERTES' && selectedTournament.registeredTeams < selectedTournament.maxTeams ? (
                  <button
                    onClick={() => {
                      setRegisterTeamId('');
                      setIsRegisterOpen(true);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>{t('tournaments.registerTeam', { fee: selectedTournament.entryFee })}</span>
                  </button>
                ) : selectedTournament.status !== 'INSCRIPTIONS_OUVERTES' || selectedTournament.registrationOpen === false ? (
                  <div className="p-3.5 text-center text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl border border-pitch-line">
                    Les inscriptions sont fermées pour ce tournoi déjà commencé.
                  </div>
                ) : (
                  <div className="p-3.5 text-center text-xs font-bold text-amber-800 bg-amber-50 rounded-2xl border border-amber-200">
                    Ce tournoi est complet pour cette édition.
                  </div>
                )}
              </div>
            )}

            {tournModalTab === 'teams' && (
              <section className="space-y-3">
                <h3 className="card-title text-sm font-bold text-pitch-ink">{t('tournaments.participatingTeams')}</h3>
                {tournamentTeams.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tournamentTeams.map((team) => {
                      const standing = selectedTournament.standings.find((row) => row.teamId === team.id);
                      return <article key={team.id} className="flex items-center gap-3 rounded-2xl border border-pitch-line bg-pitch-panel p-3">
                        <img src={team.logoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                        <div className="min-w-0 flex-1">
                          <EntityLink section="teams" id={team.id} className="font-bold text-pitch-ink">{team.name}</EntityLink>
                          <p className="text-xs text-slate-500">{team.city} · {standing?.played ?? 0} matchs · {standing?.points ?? 0} pts</p>
                        </div>
                      </article>;
                    })}
                  </div>
                ) : <p className="rounded-2xl bg-pitch-panel p-4 text-sm text-slate-500">{t('tournaments.noTeams')}</p>}
              </section>
            )}

            {tournModalTab === 'stadiums' && (
              <section className="space-y-3">
                <h3 className="card-title text-sm font-bold text-pitch-ink">{t('tournaments.stadiums')}</h3>
                {tournamentStadiums.length ? <div className="grid gap-3 sm:grid-cols-2">
                  {tournamentStadiums.map((stadium) => {
                    return <article key={stadium.id} className="flex items-start gap-3 rounded-2xl border border-pitch-line bg-pitch-panel p-4">
                      <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-pitch-primary" />
                      <div>
                        {stadium.pitchId ? <EntityLink section="pitches" id={stadium.pitchId} className="font-bold text-pitch-ink">{stadium.name}</EntityLink>
                          : <h4 className="font-bold text-pitch-ink">{stadium.name}</h4>}
                        <p className="mt-1 text-xs text-slate-500">{stadium.address || stadium.city || selectedTournament.city}</p>
                      </div>
                    </article>;
                  })}
                </div> : <p className="rounded-2xl bg-pitch-panel p-4 text-sm text-slate-500">{t('tournaments.noStadiums')}</p>}
              </section>
            )}

            {tournModalTab === 'scorers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{t('tournaments.scorerRanking')}</span>
                  <span className="text-slate-400 font-semibold">{tournScorers.length} joueurs</span>
                </div>
                <div className="rounded-2xl border border-pitch-line overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-pitch-panel text-slate-500 font-bold border-b border-pitch-line">
                        <th className="py-2.5 px-3 text-center w-8">#</th>
                        <th className="py-2.5 px-3">{t('tournaments.scorer')}</th>
                        <th className="py-2.5 px-3">{t('tournaments.club')}</th>
                        <th className="py-2.5 px-3 text-center">{t('tournaments.playedShort')}</th>
                        <th className="py-2.5 px-3 text-center text-pitch-primary font-black">{t('tournaments.goals')}</th>
                        <th className="py-2.5 px-3 text-center">{t('tournaments.ratio')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pitch-separator">
                      {tournScorers.map((s) => (
                        <tr key={s.playerId} className="hover:bg-[#f6f9f5]">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                            {s.rank}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-pitch-ink">
                            <div className="flex items-center gap-2">
                              <img src={s.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                              <EntityLink section="players" id={s.playerId}>{s.playerName}</EntityLink>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            <EntityLink section="teams" id={s.teamId}>{s.teamName}</EntityLink>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums font-semibold">
                            {s.matchesPlayed}
                          </td>
                          <td className="py-2.5 px-3 text-center tabular-nums">
                            <span className="px-2 py-0.5 rounded-full bg-[#e8f5e6] text-pitch-primary font-black text-xs">
                              {s.goals}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700 tabular-nums">
                            {s.ratio}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tournModalTab === 'assists' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{t('tournaments.assisterRanking')}</span>
                  <span className="text-slate-400 font-semibold">{tournAssisters.length} joueurs</span>
                </div>
                <div className="rounded-2xl border border-pitch-line overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-pitch-panel text-slate-500 font-bold border-b border-pitch-line">
                        <th className="py-2.5 px-3 text-center w-8">#</th>
                        <th className="py-2.5 px-3">{t('tournaments.assister')}</th>
                        <th className="py-2.5 px-3">{t('tournaments.club')}</th>
                        <th className="py-2.5 px-3 text-center">{t('tournaments.playedShort')}</th>
                        <th className="py-2.5 px-3 text-center text-pitch-primary font-black">{t('tournaments.assists')}</th>
                        <th className="py-2.5 px-3 text-center">{t('tournaments.keyPasses')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pitch-separator">
                      {tournAssisters.map((a) => (
                        <tr key={a.playerId} className="hover:bg-[#f6f9f5]">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                            {a.rank}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-pitch-ink">
                            <div className="flex items-center gap-2">
                              <img src={a.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                              <EntityLink section="players" id={a.playerId}>{a.playerName}</EntityLink>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            <EntityLink section="teams" id={a.teamId}>{a.teamName}</EntityLink>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums font-semibold">
                            {a.matchesPlayed}
                          </td>
                          <td className="py-2.5 px-3 text-center tabular-nums">
                            <span className="px-2 py-0.5 rounded-full bg-[#f2f9ec] text-pitch-primary font-black text-xs">
                              {a.assists}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700 tabular-nums">
                            {a.keyPasses}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Register Team Modal */}
      {isRegisterOpen && selectedTournament && (
        <Modal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          title={t('tournaments.registerTitle')}
          subtitle={selectedTournament.title}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('tournaments.participantTeam')}</label>
              <SelectField
                value={registerTeamId}
                onChange={(e) => setRegisterTeamId(e.target.value)}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              >
                <option value="">{t('tournaments.chooseExistingTeam')}</option>
                {teams.filter((team) => !(selectedTournament.participantTeamIds ?? []).includes(team.id)).map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </SelectField>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 cursor-pointer"
              >{t('common.cancel')}</button>
              <button
                onClick={handleRegister}
                disabled={!registerTeamId || isSubmitting}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? t('common.loading') : t('tournaments.confirmRegistration')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Tournament Modal */}
      {tournamentModal.mode === 'create' && (
        <Modal
          isOpen={tournamentModal.mode === 'create'}
          onClose={tournamentModal.close}
          title={t('tournaments.createTitle')}
          subtitle={t('tournaments.createSubtitle')}
          maxWidth="lg"
        >
          <form onSubmit={handleCreateTournament} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titre officiel du tournoi *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t('tournaments.titleExample')}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('tournaments.formatRequired')}</label>
                <SelectField
                  value={formFormat}
                  onChange={(e) => setFormFormat(e.target.value as Tournament['format'] | '')}
                  required
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="">{t('tournaments.chooseFormat')}</option>
                  {(catalogOptions?.tournamentFormats ?? []).map((format) => <option key={format} value={format}>{format}</option>)}
                </SelectField>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('tournaments.maxTeamsLabel')}</label>
                <input
                  type="number"
                  min={2}
                  max={128}
                  step={1}
                  value={formMaxTeams}
                  onChange={(event) => setFormMaxTeams(event.target.value ? Number(event.target.value) : '')}
                  placeholder="16"
                  required
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('tournaments.hostCity')}</label>
                <input
                  type="text"
                  required
                  readOnly
                  value={formCity}
                  placeholder={t('tournaments.cityFromPitch')}
                  className="w-full cursor-not-allowed rounded-2xl border border-pitch-line bg-pitch-panel p-3 text-xs text-pitch-ink outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('tournaments.hostStadium')}</label>
                <SelectField
                  name="tournament-pitch"
                  value={formPitchIds[0] ?? ''}
                  required
                  disabled={ownedPitches.length === 0}
                  onChange={(event) => {
                    const pitch = ownedPitches.find((item) => item.id === event.target.value);
                    setFormPitchIds(pitch ? [pitch.id] : []);
                    setFormVenue(pitch?.complexName || pitch?.name || '');
                    if (pitch?.city) setFormCity(pitch.city);
                  }}
                  className="w-full rounded-2xl border border-pitch-line bg-pitch-panel p-3 text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="">{t('tournaments.selectOwnedPitch')}</option>
                  {ownedPitches.map((pitch) => <option key={pitch.id} value={pitch.id}>{pitch.complexName || pitch.name} · {pitch.city}</option>)}
                </SelectField>
                {ownedPitches.length === 0 && <p className="mt-1 text-xs text-amber-800">{t('tournaments.noOwnedPitches')}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <DatePickerField id="tournament-start-date" label={t('tournaments.startDate')} value={formStartDate} onChange={setFormStartDate} min={getTodayDateInputValue()} required />
              </div>

              <div>
                <DatePickerField id="tournament-end-date" label={t('tournaments.endDate')} value={formEndDate} onChange={setFormEndDate} min={formStartDate || getTodayDateInputValue()} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('tournaments.prizePoolRequired')}</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={formPrizePool}
                  onChange={(e) => setFormPrizePool(e.target.value)}
                  placeholder="1200"
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('tournaments.entryFeeRequired')}</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="5"
                  value={formEntryFee}
                  onChange={(e) => setFormEntryFee(e.target.value)}
                  placeholder="80"
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('tournaments.organizerRequired')}</label>
              <input
                type="text"
                required
                value={formOrganizer}
                onChange={(e) => setFormOrganizer(e.target.value)}
                placeholder={t('tournaments.organizerExample')}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              />
            </div>

            {/* Banner Theme Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('tournaments.bannerLabel')}</label>
              <ImageUploadField purpose="tournament" label={t('tournaments.uploadBanner')} onUploaded={setFormBannerUrl} disabled={isCreating || !user?.roles?.includes('Organisateur Tournoi')} disabledHint={t('tournaments.bannerRoleHint')} />
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TOURNAMENT_BANNER_PRESETS.map((preset) => {
                  const isSelected = formBannerUrl === preset.url;
                  return (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() => setFormBannerUrl(preset.url)}
                      className={`relative h-20 rounded-2xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                        isSelected ? 'border-pitch-primary ring-2 ring-lime-volt' : 'border-transparent hover:opacity-90'
                      }`}
                    >
                      <img src={preset.url} alt={t(`tournaments.bannerPreset.${preset.name}`)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                        <span className="text-caption font-bold text-white leading-tight">
                          {t(`tournaments.bannerPreset.${preset.name}`)}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-lime-volt text-pitch-ink flex items-center justify-center font-bold text-micro">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-pitch-separator">
              <button
                type="button"
                onClick={tournamentModal.close}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 cursor-pointer"
              >{t('common.cancel')}</button>
              <button
                type="submit"
                disabled={isCreating || !canCreateTournament}
                className="px-6 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCreating ? t('tournaments.creating') : t('tournaments.publishTournament')}
              </button>
            </div>
          </form>
        </Modal>
      )}

  </>;
}
