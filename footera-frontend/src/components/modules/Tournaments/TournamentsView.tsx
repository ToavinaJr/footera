import React, { useState, useEffect } from 'react';
import { SelectField } from '../../common/SelectField';
import { Trophy, Calendar, MapPin, Users, Award, Shield, CheckCircle2, Plus, Sparkles, Building2, Layers, Target } from 'lucide-react';
import { tournamentsService, CreateTournamentInput } from '../../../services/tournamentsService';
import { statsService } from '../../../services/statsService';
import { Tournament, TopScorerItem, TopAssisterItem, Team, TournamentStadium } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { EntityLink } from '../../common/EntityLink';
import { useApp } from '../../../context/useApp';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { teamsService } from '../../../services/teamsService';
import { DatePickerField } from '../../common/DatePickerField';
import { formatDateForDisplay, getTodayDateInputValue } from '../../../utils/date';
import { catalogsService } from '../../../services/catalogsService';
import type { CatalogOptions } from '../../../types';
import { ImageUploadField } from '../../common/ImageUploadField';
import { PhotoGallery } from '../../common/PhotoGallery';
import { useTranslation } from '../../../i18n';

const TOURNAMENT_BANNER_PRESETS = [
  {
    name: 'Nuit & Projecteurs',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Pelouse de Finale',
    url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Arène Five & Futsal',
    url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Coupe & Gloire',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80',
  },
];

export const TournamentsView: React.FC = () => {
  const { showToast, selectedResourceId, user } = useApp();
  const { t } = useTranslation();
  const tournamentModal = useRouteModal('/tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournModalTab, setTournModalTab] = useState<'overview' | 'teams' | 'stadiums' | 'scorers' | 'assists'>('overview');
  const [tournScorers, setTournScorers] = useState<TopScorerItem[]>([]);
  const [tournAssisters, setTournAssisters] = useState<TopAssisterItem[]>([]);

  // Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerTeamId, setRegisterTeamId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [ownedPitches, setOwnedPitches] = useState<import('../../../types').Pitch[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  const [tournamentStadiums, setTournamentStadiums] = useState<TournamentStadium[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Tournament Modal
  const [formTitle, setFormTitle] = useState('');
  const [formFormat, setFormFormat] = useState<Tournament['format'] | ''>('');
  const [formCity, setFormCity] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formPitchIds, setFormPitchIds] = useState<string[]>([]);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formMaxTeams, setFormMaxTeams] = useState<number | ''>('');

  const [formEntryFee, setFormEntryFee] = useState('');
  const [formPrizePool, setFormPrizePool] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const canCreateTournament = Boolean(formTitle.trim() && formFormat && formCity.trim() && formVenue.trim()
    && formPitchIds.length === 1
    && formStartDate && formEndDate >= formStartDate && typeof formMaxTeams === 'number' && formMaxTeams >= 2 && formMaxTeams <= 128
    && formEntryFee !== '' && Number.isFinite(Number(formEntryFee)) && Number(formEntryFee) >= 0
    && formPrizePool !== '' && Number.isFinite(Number(formPrizePool)) && Number(formPrizePool) >= 0
    && formOrganizer.trim() && formBannerUrl);

  useEffect(() => {
    catalogsService.getOptions().then(setCatalogOptions).catch((err: unknown) => {
      showToast(err instanceof Error ? err.message : 'Impossible de charger les options du tournoi.', 'error');
    });
  }, [showToast]);

  useEffect(() => {
    if (!user) return;
    tournamentsService.listMyPitches().then(setOwnedPitches).catch(() => setOwnedPitches([]));
  }, [user?.id]);

  useEffect(() => {
    async function loadTournaments() {
      setIsLoading(true);
      try {
        const data = await tournamentsService.list();
        setTournaments(data);

        const resourceId = tournamentModal.resourceId || selectedResourceId;
        if (resourceId) {
          const match = data.find((t) => t.id === resourceId);
          if (match) setSelectedTournament(match);
        }
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Erreur lors du chargement des tournois', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadTournaments();
  }, [selectedResourceId, showToast, tournamentModal.resourceId]);

  useEffect(() => {
    teamsService.list().then(setTeams).catch((err: unknown) => {
      showToast(err instanceof Error ? err.message : 'Erreur lors du chargement des équipes', 'error');
    });
  }, [showToast]);

  useEffect(() => {
    if (selectedTournament) {
      setTournModalTab('overview');
      statsService.getTopScorers({ tournamentId: selectedTournament.id }).then(setTournScorers);
      statsService.getTopAssisters({ tournamentId: selectedTournament.id }).then(setTournAssisters);
      Promise.all([
        tournamentsService.listParticipatingTeams(selectedTournament.id),
        tournamentsService.listPitches(selectedTournament.id),
      ]).then(([participatingTeams, stadiums]) => {
        setTournamentTeams(participatingTeams);
        setTournamentStadiums(stadiums);
      }).catch((error: unknown) => {
        showToast(error instanceof Error ? error.message : 'Erreur lors du chargement des détails du tournoi', 'error');
      });
    }
  }, [selectedTournament?.id, showToast]);

  const handleRegister = async () => {
    if (!selectedTournament || !registerTeamId) return;
    const team = teams.find((item) => item.id === registerTeamId);
    if (!team) return;
    setIsSubmitting(true);
    try {
      const ok = await tournamentsService.registerTeam(selectedTournament.id, registerTeamId);
      if (ok) {
        showToast(`Inscription validée pour ${team.name} !`, 'success');
        setIsRegisterOpen(false);
        setRegisterTeamId('');
        const updated = await tournamentsService.getById(selectedTournament.id);
        setSelectedTournament(updated);
        const allUpdated = await tournamentsService.list();
        setTournaments(allUpdated);
      }
    } catch {
      showToast('Erreur lors de l’inscription au tournoi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formVenue.trim() || !formCity.trim() || !formFormat || !formMaxTeams || !formStartDate || !formEndDate || !formOrganizer.trim() || !formBannerUrl) {
      showToast('Veuillez remplir tous les champs obligatoires.', 'info');
      return;
    }
    if (formStartDate < getTodayDateInputValue() || formEndDate < formStartDate) {
      showToast('Vérifiez les dates : la fin doit être après le début et le tournoi ne peut pas commencer dans le passé.', 'info');
      return;
    }

    const fee = parseFloat(formEntryFee);
    const prize = parseFloat(formPrizePool);
    if (!Number.isFinite(fee) || fee < 0 || !Number.isFinite(prize) || prize < 0) {
      showToast('Veuillez entrer des montants valides pour les frais et dotations.', 'info');
      return;
    }

    setIsCreating(true);
    try {
      const input: CreateTournamentInput = {
        title: formTitle.trim(),
        format: formFormat,
        city: formCity.trim(),
        venue: formVenue.trim(),
        startDate: formStartDate.trim(),
        endDate: formEndDate.trim(),
        maxTeams: formMaxTeams,
        entryFee: fee,
        prizePool: prize,
        bannerUrl: formBannerUrl,
        organizer: formOrganizer.trim(),
        pitchIds: formPitchIds,
      };

      const created = await tournamentsService.create(input);
      showToast(`Tournoi "${created.title}" créé et publié avec succès !`);
      resetCreateTournamentForm();

      // Refresh list and select the new tournament
      const allUpdated = await tournamentsService.list();
      setTournaments(allUpdated);
      tournamentModal.openDetail(created.id, true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la création du tournoi', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateTournamentForm = () => {
    setFormTitle('');
    setFormFormat('');
    setFormCity('');
    setFormVenue('');
    setFormPitchIds([]);
    setFormStartDate('');
    setFormEndDate('');
    setFormMaxTeams('');
    setFormEntryFee('');
    setFormPrizePool('');
    setFormOrganizer('');
    setFormBannerUrl('');
  };

  const handleOpenCreateTournament = () => {
    resetCreateTournamentForm();
    tournamentModal.openCreate();
  };

  return (
    <div className="page-enter space-y-6 pb-16">
      {/* Header with CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            Tournois & Compétitions
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Participez aux tournois majeurs (11v11, Five, Futsal), remportez des dotations et hissez votre club au sommet.
          </p>
        </div>

        <button
          onClick={handleOpenCreateTournament}
          className="px-5 py-2.5 min-h-11 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Organiser un tournoi</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Aucun tournoi disponible"
          description="De nouvelles compétitions seront bientôt publiées."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((tourn) => (
            <div
              key={tourn.id}
              onClick={() => tournamentModal.openDetail(tourn.id)}
              className="rounded-3xl bg-white border border-pitch-line hover:border-pitch-primary/50 overflow-hidden transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={tourn.bannerUrl}
                    alt={tourn.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full bg-lime-volt text-pitch-ink font-extrabold text-xs shadow-xs">
                      {tourn.status === 'INSCRIPTIONS_OUVERTES' ? 'Inscriptions ouvertes' : 'En cours'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-xs font-bold text-lime-volt block mb-0.5">
                      {tourn.format} · {tourn.organizer}
                    </span>
                    <h3 className="text-lg font-extrabold text-white truncate">
                      {tourn.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-pitch-primary shrink-0" />
                      <span>{formatDateForDisplay(tourn.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-pitch-primary shrink-0" />
                      <span className="truncate">{tourn.city}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-pitch-panel border border-border-subtle flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-caption block font-medium">Dotation Vainqueur</span>
                      <strong className="text-pitch-primary font-extrabold text-base tabular-nums">
                        {tourn.prizePool.toLocaleString()} €
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-caption block font-medium">Équipes engagées</span>
                      <strong className="text-pitch-ink font-extrabold text-sm tabular-nums">
                        {tourn.registeredTeams} / {tourn.maxTeams}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-pitch-panel border-t border-pitch-separator flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{tourn.venue}</span>
                <span className="font-bold text-pitch-primary group-hover:translate-x-0.5 transition-transform">
                  Consulter le tournoi →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs font-bold text-lime-volt uppercase tracking-wider block">
                  Organisé par {selectedTournament.organizer}
                </span>
                <h2 className="text-xl font-extrabold text-white">{selectedTournament.title}</h2>
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
                <span>Buteurs ({tournScorers.length})</span>
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
                <span>Passeurs ({tournAssisters.length})</span>
              </button>
            </div>

            {tournModalTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3.5 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-slate-500 text-caption block">Prize Pool</span>
                    <strong className="text-pitch-primary text-base font-extrabold tabular-nums">
                      {selectedTournament.prizePool.toLocaleString()} €
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-slate-500 text-caption block">Frais d&apos;inscription</span>
                    <strong className="text-pitch-ink text-base font-extrabold tabular-nums">
                      {selectedTournament.entryFee} €
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-pitch-panel border border-pitch-line">
                    <span className="text-slate-500 text-caption block">Places</span>
                    <strong className="text-[#059669] text-base font-extrabold tabular-nums">
                      {selectedTournament.remainingTeams ?? 0} restantes
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-pitch-panel border border-border-subtle space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Dates de la compétition :</span>
                    <span className="font-bold text-pitch-ink">{formatDateForDisplay(selectedTournament.startDate)} au {formatDateForDisplay(selectedTournament.endDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Lieu & Infrastructure :</span>
                    <span className="font-bold text-pitch-ink">{selectedTournament.venue}, {selectedTournament.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Format de jeu :</span>
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
                    <span>Inscrire mon équipe au tournoi ({selectedTournament.entryFee} €)</span>
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
                <h3 className="text-sm font-bold text-pitch-ink">Équipes participantes</h3>
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
                ) : <p className="rounded-2xl bg-pitch-panel p-4 text-sm text-slate-500">Aucune équipe inscrite pour le moment.</p>}
              </section>
            )}

            {tournModalTab === 'stadiums' && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-pitch-ink">Stades et complexes d’accueil</h3>
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
                </div> : <p className="rounded-2xl bg-pitch-panel p-4 text-sm text-slate-500">Aucun stade renseigné pour le moment.</p>}
              </section>
            )}

            {tournModalTab === 'scorers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Classement des buteurs dans ce tournoi</span>
                  <span className="text-slate-400 font-semibold">{tournScorers.length} joueurs</span>
                </div>
                <div className="rounded-2xl border border-pitch-line overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-pitch-panel text-slate-500 font-bold border-b border-pitch-line">
                        <th className="py-2.5 px-3 text-center w-8">#</th>
                        <th className="py-2.5 px-3">Buteur</th>
                        <th className="py-2.5 px-3">Club</th>
                        <th className="py-2.5 px-3 text-center">MJ</th>
                        <th className="py-2.5 px-3 text-center text-pitch-primary font-black">Buts</th>
                        <th className="py-2.5 px-3 text-center">Ratio</th>
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
                  <span className="font-bold text-slate-700">Classement des passeurs dans ce tournoi</span>
                  <span className="text-slate-400 font-semibold">{tournAssisters.length} joueurs</span>
                </div>
                <div className="rounded-2xl border border-pitch-line overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-pitch-panel text-slate-500 font-bold border-b border-pitch-line">
                        <th className="py-2.5 px-3 text-center w-8">#</th>
                        <th className="py-2.5 px-3">Passeur</th>
                        <th className="py-2.5 px-3">Club</th>
                        <th className="py-2.5 px-3 text-center">MJ</th>
                        <th className="py-2.5 px-3 text-center text-pitch-primary font-black">Passes</th>
                        <th className="py-2.5 px-3 text-center">Clés</th>
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
          title="Inscription d'équipe"
          subtitle={selectedTournament.title}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Équipe participante *
              </label>
              <SelectField
                value={registerTeamId}
                onChange={(e) => setRegisterTeamId(e.target.value)}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              >
                <option value="">Sélectionner une équipe existante</option>
                {teams.filter((team) => !(selectedTournament.participantTeamIds ?? []).includes(team.id)).map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </SelectField>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleRegister}
                disabled={!registerTeamId || isSubmitting}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Validation...' : 'Confirmer l’inscription'}
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
          title="Organiser un tournoi"
          subtitle="Configurez et lancez une nouvelle compétition officielle"
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
                placeholder="Ex: Tournoi National des Éperviers 2026"
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Format de jeu *</label>
                <SelectField
                  value={formFormat}
                  onChange={(e) => setFormFormat(e.target.value as Tournament['format'] | '')}
                  required
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="">Choisir un format</option>
                  {(catalogOptions?.tournamentFormats ?? []).map((format) => <option key={format} value={format}>{format}</option>)}
                </SelectField>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre d&apos;équipes max *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville hôte *</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Ex: Fianarantsoa"
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stade ou Complexe d&apos;accueil *</label>
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
                <DatePickerField id="tournament-start-date" label="Date de début *" value={formStartDate} onChange={setFormStartDate} min={getTodayDateInputValue()} required />
              </div>

              <div>
                <DatePickerField id="tournament-end-date" label="Date de fin / Finales *" value={formEndDate} onChange={setFormEndDate} min={formStartDate || getTodayDateInputValue()} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dotation Vainqueur / Prize Pool (€) *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Frais d&apos;inscription par équipe (€) *</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Organisateur / Comité responsable *</label>
              <input
                type="text"
                required
                value={formOrganizer}
                onChange={(e) => setFormOrganizer(e.target.value)}
                placeholder="Ex: Ligue Régionale de Football Matsiatra"
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              />
            </div>

            {/* Banner Theme Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Visuel officiel du tournoi *
              </label>
              <ImageUploadField purpose="tournament" label="Importer un visuel du tournoi" onUploaded={setFormBannerUrl} disabled={isCreating || !user?.roles?.includes('Organisateur Tournoi')} disabledHint="Le rôle Organisateur Tournoi doit être attribué à votre compte pour importer une image." />
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
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                        <span className="text-caption font-bold text-white leading-tight">
                          {preset.name}
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
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isCreating || !canCreateTournament}
                className="px-6 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCreating ? 'Création en cours...' : 'Publier et ouvrir le tournoi'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
