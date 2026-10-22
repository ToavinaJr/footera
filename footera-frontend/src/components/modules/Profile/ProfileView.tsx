import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  Shield, 
  MapPin, 
  Phone, 
  Mail, 
  RotateCcw, 
  Edit3, 
  Check, 
  Calendar, 
  Briefcase, 
  XCircle,
  Trophy,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../../context/useApp';
import { bookingsService } from '../../../services/bookingsService';
import { recruitmentService } from '../../../services/recruitmentService';
import { Booking, Application, UserRole, Position, StrongFoot } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { EntityLink } from '../../common/EntityLink';
import { teamsService } from '../../../services/teamsService';
import { playersService } from '../../../services/playersService';
import type { Player, Team } from '../../../types';
import { PlayerCareerPanel } from '../Players/PlayerCareerPanel';
import { validateSportsCv, type SportsCvErrors } from './sportsCvValidation';
import { ImageUploadField } from '../../common/ImageUploadField';

export const ProfileView: React.FC = () => {
  const { user, switchRole, updateProfile, updateSportsCv, resetDemo, showToast, selectedResourceId } = useApp();
  const { profileId } = useParams();
  const isOwner = !profileId;
  const location = useLocation();
  const navigate = useNavigate();
  const isEditCvOpen = location.pathname === '/profile/edit-cv';
  const activeTab: 'profile' | 'bookings' | 'applications' = location.pathname.startsWith('/profile/bookings')
    ? 'bookings'
    : location.pathname === '/profile/applications'
      ? 'applications'
      : 'profile';
  const setActiveTab = (tab: 'profile' | 'bookings' | 'applications') => {
    const path = tab === 'profile' ? '/profile' : `/profile/${tab}`;
    navigate(path);
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [publicPlayer, setPublicPlayer] = useState<Player | null>(null);
  const [isLoadingPublicPlayer, setIsLoadingPublicPlayer] = useState(false);
  const [publicPlayerNotFound, setPublicPlayerNotFound] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Edit CV modal
  const [cvPosition, setCvPosition] = useState<Position>(user?.sportsCv.primaryPosition || 'Milieu Central');
  const [cvHeight, setCvHeight] = useState(user?.sportsCv.height || 180);
  const [cvWeight, setCvWeight] = useState(user?.sportsCv.weight || 75);
  const [cvFoot, setCvFoot] = useState<StrongFoot>(user?.sportsCv.strongFoot || 'Droitier');
  const [cvBio, setCvBio] = useState(user?.sportsCv.bio || '');
  const [cvCurrentTeam, setCvCurrentTeam] = useState(user?.sportsCv.currentTeam || '');
  const [cvErrors, setCvErrors] = useState<SportsCvErrors>({});
  const [isSavingCv, setIsSavingCv] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    let isActive = true;
    setIsLoadingPublicPlayer(true);
    setPublicPlayerNotFound(false);
    setPublicPlayer(null);
    Promise.all([playersService.getById(profileId), teamsService.list().catch(() => [])])
      .then(([player, teamList]) => {
        if (!isActive) return;
        setPublicPlayer(player);
        setTeams(teamList);
      })
      .catch(() => { if (isActive) setPublicPlayerNotFound(true); })
      .finally(() => { if (isActive) setIsLoadingPublicPlayer(false); });
    return () => { isActive = false; };
  }, [profileId]);

  useEffect(() => {
    if (!isOwner || !user) return;
    async function loadUserData() {
      setIsLoadingData(true);
      try {
        const [b, a, teamsData] = await Promise.all([
          bookingsService.list(),
          recruitmentService.listMyApplications(),
          teamsService.list().catch(() => []),
        ]);
        setBookings(b);
        setApplications(a);
        setTeams(teamsData);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('Failed to load profile sub-data:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadUserData();
  }, [isOwner, user]);

  useEffect(() => {
    if (!isOwner || !user?.name) return;
    playersService.list({ query: user.name })
      .then((players) => setMyPlayer(players.find((player) => player.name.toLowerCase() === user.name.toLowerCase()) ?? null))
      .catch(() => setMyPlayer(null));
  }, [isOwner, user?.name]);

  const handleSaveCv = async (e: React.FormEvent) => {
    e.preventDefault();
    const cv = {
      primaryPosition: cvPosition,
      height: Number(cvHeight),
      weight: Number(cvWeight),
      strongFoot: cvFoot,
      bio: cvBio,
      currentTeam: cvCurrentTeam,
    };
    const errors = validateSportsCv(cv);
    setCvErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSavingCv(true);
    const saved = await updateSportsCv(cv);
    setIsSavingCv(false);
    if (saved) navigate('/profile', { replace: true });
  };

  const closeEditCv = () => navigate('/profile', { replace: true });

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const ok = await bookingsService.cancelBooking(bookingId);
      if (ok) {
        showToast('Réservation annulée avec succès');
        setBookings((current) => current.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'CANCELLED' } : booking,
        ));
      } else {
        showToast('Réservation introuvable ou déjà supprimée.', 'error');
      }
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
        return;
      }
      showToast('Erreur lors de l’annulation', 'error');
    }
  };

  if (profileId && isLoadingPublicPlayer) return <div className="rounded-3xl border border-pitch-line bg-white p-8 text-sm text-slate-500">Chargement du profil joueur…</div>;
  if (profileId && (publicPlayerNotFound || !publicPlayer)) return <div className="rounded-3xl border border-pitch-line bg-white p-8 text-sm text-slate-600">Ce profil joueur est introuvable ou indisponible.</div>;
  if (isOwner && !user) return null;

  const displayedPlayer = isOwner ? myPlayer : publicPlayer;
  const displayedName = isOwner ? user!.name : publicPlayer!.name;
  const displayedAvatar = isOwner ? user!.avatarUrl : publicPlayer!.avatarUrl;
  const displayedTeam = isOwner ? user!.sportsCv.currentTeam : publicPlayer!.currentTeam;

  const rolesAvailable: UserRole[] = [
    'Joueur',
    'Entraîneur',
    'Gestionnaire Terrain',
    'Organisateur Tournoi',
    'Vendeur',
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-pitch-line shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="shrink-0 space-y-2">
            <img
              src={displayedAvatar}
              alt={displayedName}
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-slate-100 border-2 border-pitch-primary"
              referrerPolicy="no-referrer"
            />
            {isOwner && <ImageUploadField
              purpose="avatar"
              label="Changer la photo"
              onUploaded={async (avatarUrl) => updateProfile({ avatarUrl })}
            />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-pitch-ink tracking-tight">
                {displayedName}
              </h1>
              <Badge variant="emerald" size="sm">{isOwner ? user!.activeRole : 'Joueur'}</Badge>
              {isOwner && myPlayer && (
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${encodeURIComponent(myPlayer.id)}`)}
                  className="ml-2 inline-flex items-center gap-1 rounded-xl border border-pitch-line px-3 py-2 text-xs font-bold text-pitch-primary hover:bg-pitch-panel-hover"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Voir le profil public
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-pitch-primary" />
                {isOwner ? user!.city : publicPlayer!.city}
              </span>
              {isOwner && <><span>·</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-pitch-primary" />
                {user!.email}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-pitch-primary" />
                {user!.phone}
              </span></>}
            </div>
            <p className="text-xs text-slate-600 pt-1">
              {displayedPlayer?.primaryPosition} · {displayedPlayer?.age} ans · {displayedPlayer?.level}<br />
              Équipe officielle : <strong className="text-pitch-ink">{displayedTeam || 'Sans équipe actuellement'}</strong>
            </p>
          </div>
        </div>

        {/* Role Switcher */}
        {isOwner && <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line space-y-2 w-full md:w-auto">
          <span className="text-caption font-bold text-slate-500 block uppercase">
            Rôle actif actuel :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {rolesAvailable.map((r) => {
              const isActive = user!.activeRole === r;
              return (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-pitch-primary text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-pitch-line'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>}
      </div>

      {/* Tabs */}
      {isOwner && <div className="flex items-center gap-2 border-b border-pitch-line pb-2">
        {[
          { label: 'CV Sportif & Infos', tab: 'profile' },
          { label: `Mes Réservations (${bookings.length})`, tab: 'bookings' },
          { label: `Mes Candidatures (${applications.length})`, tab: 'applications' },
        ].map((t) => (
          <button
            key={t.tab}
            onClick={() => setActiveTab(t.tab as 'profile' | 'bookings' | 'applications')}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === t.tab
                ? 'bg-pitch-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-pitch-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>}

      {/* Tab 1: CV Sportif */}
      {(activeTab === 'profile' || !isOwner) && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-pitch-line space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-pitch-ink">CV Sportif Vérifié</h2>
                <p className="text-xs text-slate-500">{isOwner ? 'Transmis lors de vos candidatures d’équipe' : 'Profil sportif public'}</p>
              </div>
              {isOwner && <button
                onClick={() => {
                  setCvPosition(user!.sportsCv.primaryPosition);
                  setCvHeight(user!.sportsCv.height);
                  setCvWeight(user!.sportsCv.weight);
                  setCvFoot(user!.sportsCv.strongFoot);
                  setCvBio(user!.sportsCv.bio);
                  setCvCurrentTeam(user!.sportsCv.currentTeam);
                  navigate('/profile/edit-cv');
                }}
                className="px-4 py-2 min-h-11 rounded-2xl bg-pitch-light hover:bg-[#d5edd9] text-pitch-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier mon CV</span>
              </button>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-slate-400 block text-caption font-semibold">Poste principal</span>
                <strong className="text-pitch-ink text-sm block mt-0.5">{isOwner ? user!.sportsCv.primaryPosition : publicPlayer!.primaryPosition}</strong>
              </div>
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-slate-400 block text-caption font-semibold">Pied fort</span>
                <strong className="text-pitch-ink text-sm block mt-0.5">{isOwner ? user!.sportsCv.strongFoot : publicPlayer!.strongFoot}</strong>
              </div>
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-slate-400 block text-caption font-semibold">Mensurations</span>
                <strong className="text-pitch-ink text-sm tabular-nums block mt-0.5">
                  {isOwner ? user!.sportsCv.height : publicPlayer!.height} cm · {isOwner ? user!.sportsCv.weight : publicPlayer!.weight} kg
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-slate-400 block text-caption font-semibold">Expérience</span>
                <strong className="text-pitch-ink text-sm tabular-nums block mt-0.5">
                  {isOwner ? user!.sportsCv.experienceYears : publicPlayer!.age} ans
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line text-xs text-slate-700 leading-relaxed">
              <h3 className="font-bold text-pitch-ink mb-1">Présentation sportive :</h3>
              {isOwner ? user!.sportsCv.bio : publicPlayer!.bio}
            </div>
          </div>

          {/* Reset Demo Data */}
          {isOwner && <div className="p-5 rounded-3xl bg-[#fdf2f2] border border-[#fecaca] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-800">Données de test locales</h3>
              <p className="text-xs text-rose-600 mt-0.5">
                Restaurez les fixtures d&apos;origine du projet Footera (équipes Betsileo FC, AS Analakely, etc.).
              </p>
            </div>
            <button
              onClick={resetDemo}
              className="px-4 py-2 min-h-11 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser les données</span>
            </button>
          </div>}
          {displayedPlayer && <PlayerCareerPanel player={displayedPlayer} />}
          {displayedPlayer && <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
            <h2 className="text-lg font-extrabold text-pitch-ink">Parcours en club</h2>
            {displayedPlayer.previousClubs.length ? <ol className="mt-4 space-y-3 border-l-2 border-pitch-line pl-4">
              {displayedPlayer.previousClubs.map((club) => {
                const matchingTeam = teams.find((team) => team.name.toLowerCase() === club.toLowerCase())
                  ?? teams.find((team) => team.clubName?.toLowerCase() === club.toLowerCase());
                return <li key={club} className="text-sm font-semibold text-slate-700"><button type="button" onClick={() => matchingTeam ? navigate(`/teams/${encodeURIComponent(matchingTeam.id)}`) : navigate(`/teams?query=${encodeURIComponent(club)}`)} className="cursor-pointer text-left hover:text-pitch-primary hover:underline">{club}</button></li>;
              })}
            </ol> : <p className="mt-3 text-sm text-slate-500">Aucun ancien club renseigné.</p>}
            {displayedPlayer.currentTeam && <p className="mt-3 text-sm font-bold text-pitch-primary">
              <button type="button" onClick={() => displayedPlayer.currentTeamId ? navigate(`/teams/${encodeURIComponent(displayedPlayer.currentTeamId)}`) : navigate(`/teams?query=${encodeURIComponent(displayedPlayer.currentTeam ?? '')}`)} className="cursor-pointer hover:underline">{displayedPlayer.currentTeam}</button> <span className="text-xs font-medium text-slate-500">(actuel)</span>
            </p>}
          </section>}
          {!isOwner && <p className="text-center text-xs text-slate-400">Cette fiche publique n’affiche ni coordonnées privées, ni réservations, ni candidatures.</p>}
        </div>
      )}

      {/* Tab 2: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-pitch-line">
              Aucune réservation active.
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className={`p-5 rounded-3xl bg-white border border-pitch-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${selectedResourceId === b.id ? 'ring-2 ring-lime-volt' : ''}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-pitch-ink"><EntityLink section="pitches" id={b.pitchId}>{b.pitchName}</EntityLink></h2>
                    <Badge
                      variant={b.status === 'CONFIRMED' ? 'emerald' : b.status === 'PENDING' ? 'amber' : 'rose'}
                      size="sm"
                    >
                      {b.status === 'CONFIRMED' ? 'Confirmée' : b.status === 'PENDING' ? 'En attente' : 'Annulée'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {b.complexName} · <strong className="text-pitch-ink">{b.date}</strong> à{' '}
                    <strong className="text-pitch-primary">{b.time}</strong>
                  </p>
                  <p className="text-xs text-slate-600">Montant total : {b.totalPrice} € TTC</p>
                </div>

                {b.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="px-4 py-2 min-h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Annuler</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-pitch-line">
              Aucune candidature transmise.
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-3xl bg-white border border-pitch-line flex items-start justify-between shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-pitch-ink">{app.adTitle}</h2>
                    <Badge variant={app.status === 'ACCEPTEE' ? 'emerald' : 'amber'} size="sm">
                      {app.status === 'EN_REVUE' ? 'En cours d’examen' : 'Acceptée'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Club : <EntityLink section="teams" id={teams.find((team) => team.name === app.teamName)?.id}>{app.teamName}</EntityLink> · Candidat : {app.applicantName} ({app.applicantPosition})
                  </p>
                  <p className="text-xs text-slate-600 italic mt-1">« {app.message} »</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit CV Modal */}
      {isEditCvOpen && (
        <Modal
          isOpen={isEditCvOpen}
          onClose={closeEditCv}
          title="Modifier mon CV Sportif"
          subtitle="Mettez à jour vos informations visibles par les recruteurs"
          maxWidth="md"
        >
          <form onSubmit={handleSaveCv} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Poste principal *
              </label>
              <select
                value={cvPosition}
                onChange={(e) => setCvPosition(e.target.value as any)}
                className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
              >
                <option value="Gardien">Gardien</option>
                <option value="Défenseur Central">Défenseur Central</option>
                <option value="Latéral Droit">Latéral Droit</option>
                <option value="Latéral Gauche">Latéral Gauche</option>
                <option value="Milieu Défensif">Milieu Défensif</option>
                <option value="Milieu Central">Milieu Central</option>
                <option value="Milieu Offensif">Milieu Offensif</option>
                <option value="Ailier Droit">Ailier Droit</option>
                <option value="Ailier Gauche">Ailier Gauche</option>
                <option value="Avant-centre">Avant-centre</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Taille (cm)</label>
                <input
                  type="number"
                  min={100}
                  max={250}
                  step={1}
                  value={cvHeight}
                  onChange={(e) => setCvHeight(Number(e.target.value))}
                  aria-invalid={!!cvErrors.height}
                  className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
                />
                {cvErrors.height && <p className="mt-1 text-xs text-rose-600">{cvErrors.height}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Poids (kg)</label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  step={1}
                  value={cvWeight}
                  onChange={(e) => setCvWeight(Number(e.target.value))}
                  aria-invalid={!!cvErrors.weight}
                  className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
                />
                {cvErrors.weight && <p className="mt-1 text-xs text-rose-600">{cvErrors.weight}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pied fort</label>
                <select
                  value={cvFoot}
                  onChange={(e) => setCvFoot(e.target.value as any)}
                  className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
                >
                  <option value="Droitier">Droitier</option>
                  <option value="Gaucher">Gaucher</option>
                  <option value="Ambidextre">Ambidextre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Club actuel</label>
              <input
                type="text"
                value={cvCurrentTeam}
                onChange={(e) => setCvCurrentTeam(e.target.value)}
                maxLength={80}
                aria-invalid={!!cvErrors.currentTeam}
                placeholder="Ex: Betsileo FC"
                className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
              />
              {cvErrors.currentTeam && <p className="mt-1 text-xs text-rose-600">{cvErrors.currentTeam}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio sportive</label>
              <textarea
                rows={3}
                value={cvBio}
                onChange={(e) => setCvBio(e.target.value)}
                maxLength={1000}
                aria-invalid={!!cvErrors.bio}
                className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
              />
              {cvErrors.bio && <p className="mt-1 text-xs text-rose-600">{cvErrors.bio}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={closeEditCv}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSavingCv}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:cursor-wait disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingCv ? 'Enregistrement…' : 'Enregistrer mon CV'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
