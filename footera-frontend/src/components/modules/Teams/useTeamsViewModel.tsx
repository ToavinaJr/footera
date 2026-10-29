import { useEffect,useState } from 'react';
import { useApp } from '../../../context/useApp';
import { useResource } from '../../../hooks/useResource';
import { useUrlState } from '../../../hooks/useUrlState';
import { useTranslation } from '../../../i18n';
import { statsService } from '../../../services/statsService';
import { teamsService } from '../../../services/teamsService';
import { Club,Team,TopAssisterItem,TopScorerItem } from '../../../types';
import { useListPagination } from '../../../hooks/useListPagination';

/** Data, URL state and mutations shared by the list and its routed dialogs. */
export function useTeamsViewModel() {
  const { showToast, selectedResourceId, toggleFavoriteTeam, user, navigateToResource } = useApp();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useUrlState<'teams' | 'clubs'>('tab', 'teams', ['teams', 'clubs']);

  // Filters
  const [searchQuery, setSearchQuery] = useUrlState<string>('query', '');
  const [categoryFilter, setCategoryFilter] = useUrlState<string>('category', 'Toutes');
  const [showFavoriteTeams, setShowFavoriteTeams] = useUrlState<boolean>('favorites', false);
  const teamList = useResource<Team[]>(JSON.stringify([searchQuery, categoryFilter]), () => teamsService.list({ query: searchQuery, category: categoryFilter }), []);
  const clubList = useResource<Club[]>('clubs', teamsService.listClubs, []);
  const teams = teamList.data;
  const clubs = clubList.data;
  const setClubs = clubList.setData;
  const isLoading = activeTab === 'teams' ? teamList.loading : clubList.loading;
  const [updatingFavoriteTeamIds, setUpdatingFavoriteTeamIds] = useState<string[]>([]);

  // Detail Modal & Members Roster Modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterTab, setRosterTab] = useState<'members' | 'stats'>('members');
  const [teamScorers, setTeamScorers] = useState<TopScorerItem[]>([]);
  const [teamAssisters, setTeamAssisters] = useState<TopAssisterItem[]>([]);

  // Join Team Modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [updatingClubLogoId, setUpdatingClubLogoId] = useState<string | null>(null);

  const isTeamMember = (team: Team) => Boolean(user && team.members?.some((member) => member.playerId === user.id));
  const visibleTeams = showFavoriteTeams
    ? teams.filter((team) => user?.favoriteTeamIds?.includes(team.id))
    : teams;
  const teamPage = useListPagination(visibleTeams);
  const clubPage = useListPagination(clubs);

  const handleToggleFavorite = async (teamId: string) => {
    if (updatingFavoriteTeamIds.includes(teamId)) return;
    setUpdatingFavoriteTeamIds((current) => [...current, teamId]);
    try {
      await toggleFavoriteTeam(teamId);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Impossible de mettre à jour vos équipes favorites.', 'error');
    } finally {
      setUpdatingFavoriteTeamIds((current) => current.filter((id) => id !== teamId));
    }
  };

  useEffect(() => {
    let active = true;
    setTeamScorers([]);
    setTeamAssisters([]);
    if (selectedTeam) Promise.all([
      statsService.getTopScorers({ teamId: selectedTeam.id, limit: 5 }),
      statsService.getTopAssisters({ teamId: selectedTeam.id, limit: 5 }),
    ]).then(([scorers, assisters]) => {
      if (active) { setTeamScorers(scorers); setTeamAssisters(assisters); }
    }).catch((error: unknown) => {
      if (active) showToast(error instanceof Error ? error.message : t('matches.loadError'), 'error');
    });
    return () => { active = false; };
  }, [selectedTeam?.id]);

  const handleJoinTeam = async () => {
    if (!selectedTeam) return;
    setIsSubmittingJoin(true);
    try {
      const res = await teamsService.joinTeam(selectedTeam.id, joinMessage);
      if (res.success) {
        showToast(res.message);
        setIsJoinModalOpen(false);
        setJoinMessage('');
        const updated = await teamsService.getById(selectedTeam.id);
        setSelectedTeam(updated);
      } else {
        showToast(res.message, 'error');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Impossible de rejoindre l’équipe', 'error');
    } finally {
      setIsSubmittingJoin(false);
    }
  };
  return { showToast, user, navigateToResource, t, activeTab, setActiveTab, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, showFavoriteTeams, setShowFavoriteTeams, teamList, clubList, teams, clubs, setClubs, isLoading, updatingFavoriteTeamIds, setSelectedTeam, setRosterTab, setIsJoinModalOpen, updatingClubLogoId, setUpdatingClubLogoId, isTeamMember, visibleTeams, teamPage, clubPage, handleToggleFavorite, selectedTeam, isRosterModalOpen, setIsRosterModalOpen, rosterTab, teamScorers, teamAssisters, isJoinModalOpen, joinMessage, setJoinMessage, isSubmittingJoin, handleJoinTeam };
}
