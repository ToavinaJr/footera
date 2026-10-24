import React, { useState, useEffect } from 'react';
import { SelectField } from '../../common/SelectField';
import { Search, Filter, Shield, Trophy, UserPlus, Heart } from 'lucide-react';
import { playersService, PlayerFilters } from '../../../services/playersService';
import { Player, Position, Team, TeamInvitationStatus } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { useApp } from '../../../context/useApp';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { teamsService } from '../../../services/teamsService';

export const PlayersView: React.FC = () => {
  const { showToast, navigateToResource, refreshNotifications } = useApp();
  const playerModal = useRouteModal('/players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [isLoadingMyTeam, setIsLoadingMyTeam] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('Toutes');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tous');
  const [onlyTransfer, setOnlyTransfer] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Detail Modal
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const profilePlayer = playerModal.resourceId
    ? players.find((player) => player.id === playerModal.resourceId) ?? null
    : null;

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
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Impossible de charger les postes et niveaux.', 'error'));
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
        showToast(error instanceof Error ? error.message : 'Impossible de charger les informations de votre équipe.', 'error');
      })
      .finally(() => setIsLoadingMyTeam(false));
  }, [showToast]);

  useEffect(() => {
    async function fetchPlayers() {
      setIsLoading(true);
      try {
        const filters: PlayerFilters = {
          query: searchQuery,
          position: selectedPosition as Position,
          level: selectedLevel,
          transferOnly: onlyTransfer,
        };
        const data = await playersService.list(filters);
        setPlayers(data);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Erreur lors du chargement des joueurs', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    const timer = setTimeout(() => {
      fetchPlayers();
    }, 120);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedPosition, selectedLevel, onlyTransfer, showToast]);

  const toggleFavorite = (playerId: string) => {
    setFavorites((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
    showToast(
      favorites.includes(playerId) ? 'Retiré de vos favoris' : 'Joueur ajouté à vos favoris'
    );
  };

  const handleSendInvite = async () => {
    if (!selectedPlayer) return;
    setIsSubmittingInvite(true);
    try {
      const result = await playersService.invite(selectedPlayer.id, inviteMessage);
      setInvitationStatuses((current) => ({ ...current, [selectedPlayer.id]: result.invitation.status }));
      await refreshNotifications();
      setIsInviteOpen(false);
      setInviteMessage('');
      showToast(result.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible d’envoyer cette invitation.', 'error');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const positionsList = ['Toutes', ...positions];

  return (
    <div className="page-enter space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            Explorer les Joueurs
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {players.length} joueurs trouvés avec CV sportif vérifié
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-pitch-ink bg-white border border-pitch-line px-3.5 py-2 rounded-2xl cursor-pointer hover:border-pitch-primary transition-colors shadow-2xs self-start md:self-auto">
          <input
            type="checkbox"
            checked={onlyTransfer}
            onChange={(e) => setOnlyTransfer(e.target.checked)}
            className="rounded text-pitch-primary focus:ring-pitch-primary border-pitch-line"
          />
          <span>Disponible pour transfert uniquement</span>
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, ville..."
              className="w-full bg-pitch-input border border-pitch-line rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-pitch-ink placeholder-slate-400 focus:border-pitch-primary focus:bg-white transition-all outline-hidden"
            />
          </div>

          <div>
            <SelectField
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              aria-label="Filtrer par poste"
              className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary transition-colors outline-hidden"
            >
              {positionsList.map((p) => (
                <option key={p} value={p}>
                  {p === 'Toutes' ? 'Tous les postes' : p}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <SelectField
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              aria-label="Filtrer par niveau"
              className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary transition-colors outline-hidden"
            >
              <option value="Tous">Tous les niveaux</option>
              {levels.map((level) => <option key={level} value={level}>{level}</option>)}
            </SelectField>
          </div>
        </div>
      </div>

      {/* Players Grid (matching user Screenshot 2) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : players.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun joueur trouvé"
          description="Essayez de modifier vos critères de recherche."
          actionLabel="Réinitialiser les filtres"
          onAction={() => {
            setSearchQuery('');
            setSelectedPosition('Toutes');
            setSelectedLevel('Tous');
            setOnlyTransfer(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const isFav = favorites.includes(player.id);
            const invitationStatus = invitationStatuses[player.id];
            const invitationButtonLabel = invitationStatus === 'PENDING'
              ? 'Invitation en attente'
              : invitationStatus === 'ACCEPTED'
                ? 'Invitation acceptée'
                : invitationStatus === 'DECLINED'
                  ? 'Invitation refusée'
                  : 'Inviter dans mon équipe';
            return (
              <div
                key={player.id}
                onClick={() => navigateToResource('players', player.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigateToResource('players', player.id);
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={`Voir le profil de ${player.name}`}
                className="rounded-3xl bg-white border border-pitch-line overflow-hidden shadow-xs hover:border-pitch-primary/50 transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-pitch-primary"
              >
                <div>
                  {/* Photo matching Screenshot 2 */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                    {/* Heart button top right */}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(player.id);
                      }}
                      aria-label="Ajouter aux favoris"
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white hover:bg-black/60 transition-colors cursor-pointer"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                    </button>
                  </div>

                  <div className="p-5 space-y-3.5">
                    {/* Player Name and Position · Age */}
                    <div>
                      <h2 className="text-xl font-extrabold text-pitch-ink tracking-tight">{player.name}</h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {player.primaryPosition} · {player.age ? `${player.age} ans` : 'Âge non renseigné'}
                      </p>
                    </div>

                    {/* Badges: Disponible / Régional */}
                    <div className="flex items-center gap-2">
                      {player.isAvailableForTransfer ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                          Disponible
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          En contrat
                        </span>
                      )}
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]">
                        {player.level}
                      </span>
                    </div>

                    {/* Team info & goals count */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-pitch-separator">
                      <span className="truncate">{player.currentTeam || 'Sans club'} · {player.city}</span>
                      <span className="font-extrabold text-pitch-primary flex items-center gap-1 shrink-0">
                        <span>🎯</span>
                        <span>{player.goals} buts</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Button matching Screenshot 2: Inviter dans mon équipe */}
                {myTeam && !isLoadingMyTeam && <div className="p-5 pt-0">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      if (invitationStatus === 'PENDING') return;
                      setSelectedPlayer(player);
                      setIsInviteOpen(true);
                    }}
                    disabled={invitationStatus === 'PENDING'}
                    className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer btn-tactical disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{invitationButtonLabel}</span>
                  </button>
                </div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {profilePlayer && (
        <Modal
          isOpen={!!profilePlayer}
          onClose={playerModal.close}
          title={profilePlayer.name}
          subtitle={`${profilePlayer.primaryPosition} · ${profilePlayer.age ? `${profilePlayer.age} ans` : 'Âge non renseigné'} · ${profilePlayer.city}`}
          maxWidth="md"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <img src={profilePlayer.avatarUrl} alt={profilePlayer.name} className="h-20 w-20 rounded-2xl object-cover object-center" />
              <div>
                <p className="font-bold text-pitch-ink">{profilePlayer.currentTeam || 'Sans club'}</p>
                <p className="text-sm text-slate-500">{profilePlayer.level} · {profilePlayer.strongFoot} · {profilePlayer.height} cm</p>
                <p className="text-sm text-slate-500">{profilePlayer.appearances} matchs · {profilePlayer.goals} buts · {profilePlayer.assists} passes décisives</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{profilePlayer.bio}</p>
            {myTeam && !isLoadingMyTeam && <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (invitationStatuses[profilePlayer.id] === 'PENDING') return;
                  playerModal.close();
                  setSelectedPlayer(profilePlayer);
                  setIsInviteOpen(true);
                }}
                disabled={invitationStatuses[profilePlayer.id] === 'PENDING'}
                className="rounded-xl bg-pitch-action px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {invitationStatuses[profilePlayer.id] === 'PENDING' ? 'Invitation en attente' : 'Inviter dans mon équipe'}
              </button>
            </div>}
          </div>
        </Modal>
      )}

      {isInviteOpen && selectedPlayer && (
        <Modal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          title={`Inviter ${selectedPlayer.name}`}
          subtitle={`Proposition de recrutement pour ${selectedPlayer.primaryPosition}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Présentez votre projet sportif et invitez {selectedPlayer.name} à une séance d&apos;essai.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Message d&apos;invitation *
              </label>
              <textarea
                rows={4}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Ex: Bonjour, nous serions ravis de t'accueillir pour un entraînement..."
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSendInvite}
                disabled={!inviteMessage.trim() || isSubmittingInvite}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmittingInvite ? 'Envoi...' : 'Envoyer l’invitation'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
