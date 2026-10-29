import React,{ useEffect,useState } from 'react';
import { useApp } from '../../../context/useApp';
import { useResource } from '../../../hooks/useResource';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { useUrlState } from '../../../hooks/useUrlState';
import { useTranslation } from '../../../i18n';
import { catalogsService } from '../../../services/catalogsService';
import { statsService } from '../../../services/statsService';
import { teamsService } from '../../../services/teamsService';
import { CreateTournamentInput,tournamentsService } from '../../../services/tournamentsService';
import type { CatalogOptions } from '../../../types';
import { Team,TopAssisterItem,TopScorerItem,Tournament,TournamentStadium } from '../../../types';
import { getTodayDateInputValue } from '../../../utils/date';
import { useListPagination } from '../../common/ListPage';

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

/** Data, URL state and mutations shared by the list and its routed dialogs. */
export function useTournamentsViewModel() {
  const { showToast, selectedResourceId, user } = useApp();
  const { t } = useTranslation();
  const tournamentModal = useRouteModal('/tournaments');
  const list = useResource<Tournament[]>('tournaments', tournamentsService.list, []);
  const tournaments = list.data;
  const setTournaments = list.setData;
  const [query, setQuery] = useUrlState<string>('query', '');
  const [favorites, setFavorites] = useUrlState<boolean>('favorites', false);
  const [mine, setMine] = useUrlState<boolean>('mine', false);
  const [status, setStatus] = useUrlState<string>('status', 'ALL');
  const page = useListPagination(tournaments.filter((item) => (!query || (item.title + ' ' + item.city).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    && (!favorites || user?.favoriteTournamentIds?.includes(item.id)) && (!mine || item.canManageGallery)
    && (status === 'ALL' || item.status === status)));
  const [catalogOptions, setCatalogOptions] = useState<CatalogOptions | null>(null);
  const isLoading = list.loading;

  // Detail Modal
  const detail = useResource<Tournament | null>(tournamentModal.resourceId ?? '', () => tournamentsService.getById(tournamentModal.resourceId!), null, !!tournamentModal.resourceId);
  const selectedTournament = detail.data?.id === tournamentModal.resourceId ? detail.data : null;
  const setSelectedTournament = detail.setData;
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
          showToast(err instanceof Error ? err.message : t('common.loadOptionsError'), 'error');
    });
  }, [showToast]);

  useEffect(() => {
    if (!user) return;
    tournamentsService.listMyPitches().then(setOwnedPitches).catch(() => setOwnedPitches([]));
  }, [user?.id]);

  useEffect(() => {
    teamsService.list().then(setTeams).catch((err: unknown) => {
      showToast(err instanceof Error ? err.message : t('common.loadTeamsError'), 'error');
    });
  }, [showToast]);

  useEffect(() => {
    let active = true;
    setTournScorers([]);
    setTournAssisters([]);
    setTournamentTeams([]);
    setTournamentStadiums([]);
    if (selectedTournament) {
      setTournModalTab('overview');
      Promise.all([
        statsService.getTopScorers({ tournamentId: selectedTournament.id }),
        statsService.getTopAssisters({ tournamentId: selectedTournament.id }),
        tournamentsService.listParticipatingTeams(selectedTournament.id),
        tournamentsService.listPitches(selectedTournament.id),
      ]).then(([scorers, assisters, participatingTeams, stadiums]) => {
        if (!active) return;
        setTournScorers(scorers);
        setTournAssisters(assisters);
        setTournamentTeams(participatingTeams);
        setTournamentStadiums(stadiums);
      }).catch((error: unknown) => {
        if (active) showToast(error instanceof Error ? error.message : t('common.loadTournamentDetailError'), 'error');
      });
    }
    return () => { active = false; };
  }, [selectedTournament?.id, showToast]);

  const handleRegister = async () => {
    if (!selectedTournament || !registerTeamId) return;
    const team = teams.find((item) => item.id === registerTeamId);
    if (!team) return;
    setIsSubmitting(true);
    try {
      const ok = await tournamentsService.registerTeam(selectedTournament.id, registerTeamId);
      if (ok) {
        showToast(t('tournaments.registrationSuccess', { team: team.name }), 'success');
        setIsRegisterOpen(false);
        setRegisterTeamId('');
        const updated = await tournamentsService.getById(selectedTournament.id);
        setSelectedTournament(updated);
        const allUpdated = await tournamentsService.list();
        setTournaments(allUpdated);
      }
    } catch {
      showToast(t('tournaments.registrationError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formVenue.trim() || !formPitchIds.length || !formCity.trim() || !formFormat || !formMaxTeams || !formStartDate || !formEndDate || !formOrganizer.trim() || !formBannerUrl) {
      showToast(t('common.requiredFields'), 'info');
      return;
    }
    if (formStartDate < getTodayDateInputValue() || formEndDate < formStartDate) {
      showToast(t('tournaments.invalidDates'), 'info');
      return;
    }

    const fee = parseFloat(formEntryFee);
    const prize = parseFloat(formPrizePool);
    if (!Number.isFinite(fee) || fee < 0 || !Number.isFinite(prize) || prize < 0) {
      showToast(t('tournaments.invalidAmounts'), 'info');
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
      showToast(t('tournaments.created', { title: created.title }), 'success');
      resetCreateTournamentForm();

      // Refresh list and select the new tournament
      const allUpdated = await tournamentsService.list();
      setTournaments(allUpdated);
      tournamentModal.openDetail(created.id, true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('tournaments.createError'), 'error');
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
  return { t, tournamentModal, list, query, setQuery, favorites, setFavorites, mine, setMine, status, setStatus, page, isLoading, detail, selectedTournament, handleOpenCreateTournament, user, catalogOptions, setSelectedTournament, tournModalTab, setTournModalTab, tournScorers, tournAssisters, isRegisterOpen, setIsRegisterOpen, registerTeamId, setRegisterTeamId, teams, ownedPitches, tournamentTeams, tournamentStadiums, isSubmitting, formTitle, setFormTitle, formFormat, setFormFormat, formCity, setFormCity, setFormVenue, formPitchIds, setFormPitchIds, formStartDate, setFormStartDate, formEndDate, setFormEndDate, formMaxTeams, setFormMaxTeams, formEntryFee, setFormEntryFee, formPrizePool, setFormPrizePool, formOrganizer, setFormOrganizer, formBannerUrl, setFormBannerUrl, isCreating, canCreateTournament, handleRegister, handleCreateTournament };
}
