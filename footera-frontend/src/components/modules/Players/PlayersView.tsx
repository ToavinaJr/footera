import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, Trophy, UserPlus, Star, Heart } from 'lucide-react';
import { playersService, PlayerFilters } from '../../../services/playersService';
import { Player, Position } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { useApp } from '../../../context/AppContext';

export const PlayersView: React.FC = () => {
  const { showToast, navigateToResource } = useApp();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('Toutes');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tous');
  const [onlyTransfer, setOnlyTransfer] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Detail Modal
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  useEffect(() => {
    async function fetchPlayers() {
      setIsLoading(true);
      try {
        const filters: PlayerFilters = {
          query: searchQuery,
          position: selectedPosition as any,
          level: selectedLevel as any,
          transferOnly: onlyTransfer,
        };
        const data = await playersService.list(filters);
        setPlayers(data);
      } catch (err: any) {
        showToast(err.message || 'Erreur lors du chargement des joueurs', 'error');
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
    await new Promise((r) => setTimeout(r, 400));
    setIsSubmittingInvite(false);
    setIsInviteOpen(false);
    setInviteMessage('');
    showToast(`Invitation officielle transmise à ${selectedPlayer.name} !`);
  };

  const positionsList: (Position | 'Toutes')[] = [
    'Toutes',
    'Milieu Central',
    'Avant-centre',
    'Ailier Droit',
    'Ailier Gauche',
    'Défenseur Central',
    'Latéral Droit',
    'Latéral Gauche',
    'Gardien',
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#092c1a] tracking-tight">
            Explorer les Joueurs
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {players.length} joueurs trouvés avec CV sportif vérifié
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-[#092c1a] bg-white border border-[#dce6d8] px-3.5 py-2 rounded-2xl cursor-pointer hover:border-[#0e5632] transition-colors shadow-2xs self-start md:self-auto">
          <input
            type="checkbox"
            checked={onlyTransfer}
            onChange={(e) => setOnlyTransfer(e.target.checked)}
            className="rounded text-[#0e5632] focus:ring-[#0e5632] border-[#dce6d8]"
          />
          <span>Disponible pour transfert uniquement</span>
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-[#dce6d8] shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, ville..."
              className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-[#092c1a] placeholder-slate-400 focus:border-[#0e5632] focus:bg-white transition-all outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              aria-label="Filtrer par poste"
              className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-full px-4 py-2.5 text-xs md:text-sm text-[#092c1a] focus:border-[#0e5632] transition-colors outline-hidden"
            >
              {positionsList.map((p) => (
                <option key={p} value={p}>
                  {p === 'Toutes' ? 'Tous les postes' : p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              aria-label="Filtrer par niveau"
              className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-full px-4 py-2.5 text-xs md:text-sm text-[#092c1a] focus:border-[#0e5632] transition-colors outline-hidden"
            >
              <option value="Tous">Tous les niveaux</option>
              <option value="National">National</option>
              <option value="Régional">Régional (R1, R2, R3)</option>
              <option value="Départemental">Départemental / District</option>
              <option value="Loisir">Loisir / Five</option>
            </select>
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
            return (
              <div
                key={player.id}
                className="rounded-3xl bg-white border border-[#dce6d8] overflow-hidden shadow-xs hover:border-[#0e5632]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo matching Screenshot 2 */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Star Rating bottom left */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-[#c6f432] text-[#c6f432]" />
                      <span>{player.rating || 7.8}</span>
                    </div>

                    {/* Heart button top right */}
                    <button
                      onClick={() => toggleFavorite(player.id)}
                      aria-label="Ajouter aux favoris"
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white hover:bg-black/60 transition-colors cursor-pointer"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                    </button>
                  </div>

                  <div className="p-5 space-y-3.5">
                    {/* Player Name and Position · Age */}
                    <div>
                      <h2 className="text-xl font-extrabold text-[#092c1a] tracking-tight">{player.name}</h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {player.primaryPosition} · {player.age} ans
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
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-[#edf3ea]">
                      <span className="truncate">{player.currentTeam || 'Sans club'} · {player.city}</span>
                      <span className="font-extrabold text-[#0e5632] flex items-center gap-1 shrink-0">
                        <span>🎯</span>
                        <span>{player.goals} buts</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Button matching Screenshot 2: Inviter dans mon équipe */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => {
                      setSelectedPlayer(player);
                      setIsInviteOpen(true);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-extrabold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer btn-tactical"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Inviter dans mon équipe</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
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
                className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSendInvite}
                disabled={!inviteMessage.trim() || isSubmittingInvite}
                className="px-5 py-2 min-h-[44px] rounded-xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
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
