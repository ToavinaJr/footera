import { useEffect,useState } from 'react';
import { useApp } from '../../../context/useApp';
import { useResource } from '../../../hooks/useResource';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { useUrlState } from '../../../hooks/useUrlState';
import { useTranslation } from '../../../i18n';
import { playersService } from '../../../services/playersService';
import { teamsService } from '../../../services/teamsService';
import { Player,Team,TeamInvitationStatus } from '../../../types';
import { useListPagination } from '../../common/ListPage';

/** Data, URL state and mutations shared by the list and its routed dialogs. */
export function usePlayersViewModel() {
  const { t } = useTranslation();
  const { showToast, navigateToResource, refreshNotifications, user } = useApp();
  const playerModal = useRouteModal('/players');
  const [positions, setPositions] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [isLoadingMyTeam, setIsLoadingMyTeam] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useUrlState<string>('query', '');
  const [selectedPosition, setSelectedPosition] = useUrlState<string>('position', 'Toutes');
  const [selectedLevel, setSelectedLevel] = useUrlState<string>('level', 'Tous');
  const [onlyTransfer, setOnlyTransfer] = useUrlState<boolean>('available', false);
  const [onlyFavorites, setOnlyFavorites] = useUrlState<boolean>('favorites', false);
  const list = useResource<Player[]>(JSON.stringify([searchQuery, selectedPosition, selectedLevel, onlyTransfer]), () => playersService.list({ query: searchQuery, position: selectedPosition, level: selectedLevel, transferOnly: onlyTransfer }), []);
  const players = list.data;
  const isLoading = list.loading;
  const page = useListPagination(players.filter((player) => !onlyFavorites || user?.favoritePlayerIds?.includes(player.id)));
  const detail = useResource<Player | null>(playerModal.resourceId ?? '', () => playersService.getById(playerModal.resourceId!), null, !!playerModal.resourceId);

  // Detail Modal
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const profilePlayer = detail.data?.id === playerModal.resourceId ? detail.data : null;

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [invitationStatuses, setInvitationStatuses] = useState<Record<string, TeamInvitationStatus>>({});

  useEffect(() => {
    playersService.options()
      .then((options) => {
        setPositions(options.positions);
        setLevels(options.levels);
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : t('players.optionsLoadError'), 'error'));
  }, [showToast]);

  useEffect(() => {
    Promise.all([teamsService.getMyTeam(), teamsService.listMyTeamInvitations()])
      .then(([team, invitations]) => {
        setMyTeam(team ?? null);
        setInvitationStatuses(invitations.reduce<Record<string, TeamInvitationStatus>>(
          (statuses, invitation) => {
            statuses[invitation.playerId] ??= invitation.status;
            return statuses;
          },
          {},
        ));
      })
      .catch((error: unknown) => {
        setMyTeam(null);
        showToast(error instanceof Error ? error.message : t('players.teamLoadError'), 'error');
      })
      .finally(() => setIsLoadingMyTeam(false));
  }, [showToast]);

  const handleSendInvite = async () => {
    if (!selectedPlayer) return;
    setIsSubmittingInvite(true);
    try {
      const result = await playersService.invite(selectedPlayer.id, inviteMessage);
      setInvitationStatuses((current) => ({ ...current, [selectedPlayer.id]: result.invitation.status }));
      await refreshNotifications();
      setIsInviteOpen(false);
      setInviteMessage('');
      showToast(t('home.invitationSent', { player: selectedPlayer.name }), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('players.inviteError'), 'error');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const positionsList = ['Toutes', ...positions];
  return { t, navigateToResource, levels, myTeam, isLoadingMyTeam, searchQuery, setSearchQuery, selectedPosition, setSelectedPosition, selectedLevel, setSelectedLevel, onlyTransfer, setOnlyTransfer, onlyFavorites, setOnlyFavorites, list, players, isLoading, page, detail, setSelectedPlayer, setIsInviteOpen, invitationStatuses, positionsList, playerModal, selectedPlayer, profilePlayer, isInviteOpen, inviteMessage, setInviteMessage, isSubmittingInvite, handleSendInvite };
}
