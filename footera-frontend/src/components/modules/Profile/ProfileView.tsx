import React, { useState, useEffect } from 'react';
import { SelectField } from '../../common/SelectField';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, 
  Phone, 
  Mail, 
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
import { Booking, Application, Position, StrongFoot } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { EntityLink } from '../../common/EntityLink';
import { teamsService } from '../../../services/teamsService';
import { playersService } from '../../../services/playersService';
import type { Player, Team } from '../../../types';
import { PlayerCareerPanel } from '../Players/PlayerCareerPanel';
import { validateSportsCv, type SportsCvErrors } from './sportsCvValidation';
import { ImageUploadField } from '../../common/ImageUploadField';
import { catalogsService } from '../../../services/catalogsService';
import { formatDateForDisplay } from '../../../utils/date';
import { PhotoGallery } from '../../common/PhotoGallery';
import { RoleRequestsPanel } from './RoleRequestsPanel';
import { useTranslation } from '../../../i18n';

export const ProfileView: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateProfile, updateSportsCv, showToast, selectedResourceId } = useApp();
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
  const [cancellingApplicationId, setCancellingApplicationId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [publicPlayer, setPublicPlayer] = useState<Player | null>(null);
  const [isLoadingPublicPlayer, setIsLoadingPublicPlayer] = useState(false);
  const [publicPlayerNotFound, setPublicPlayerNotFound] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [strongFootOptions, setStrongFootOptions] = useState<string[]>([]);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [contactName, setContactName] = useState(user?.name ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [personalInfoError, setPersonalInfoError] = useState('');

  // Edit CV modal
  const [cvPosition, setCvPosition] = useState<Position>(user?.sportsCv.primaryPosition || '');
  const [cvHeight, setCvHeight] = useState(user?.sportsCv.height || 180);
  const [cvWeight, setCvWeight] = useState(user?.sportsCv.weight || 75);
  const [cvFoot, setCvFoot] = useState<StrongFoot>(user?.sportsCv.strongFoot || '');
  const [cvBio, setCvBio] = useState(user?.sportsCv.bio || '');
  const [cvCurrentTeam, setCvCurrentTeam] = useState(user?.sportsCv.currentTeam || '');
  const [cvErrors, setCvErrors] = useState<SportsCvErrors>({});
  const [isSavingCv, setIsSavingCv] = useState(false);

  useEffect(() => {
    catalogsService.getOptions()
      .then((options) => {
        setPositionOptions(options.playerPositions);
        setStrongFootOptions(options.strongFeet);
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Impossible de charger les options du CV sportif.', 'error'));
  }, [showToast]);

  useEffect(() => {
    setContactName(user?.name ?? '');
    setContactPhone(user?.phone ?? '');
    setDateOfBirth(user?.dateOfBirth ?? '');
  }, [user?.name, user?.phone, user?.dateOfBirth]);

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
      } catch (err: unknown) {
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
  }, [isOwner, user?.name, user?.dateOfBirth, user?.avatarUrl]);

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
    const errors = validateSportsCv(cv, positionOptions, strongFootOptions);
    setCvErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSavingCv(true);
    const saved = await updateSportsCv(cv);
    setIsSavingCv(false);
    if (saved) navigate('/profile', { replace: true });
  };

  const closeEditCv = () => navigate('/profile', { replace: true });

  const handleSavePersonalInfo = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = contactName.trim();
    if (name.length < 2 || name.length > 80) {
      setPersonalInfoError('Le nom doit contenir entre 2 et 80 caractères.');
      return;
    }
    const phone = contactPhone.trim();
    if (phone && !/^[+()\d.\-\s]{7,32}$/.test(phone)) {
      setPersonalInfoError('Saisissez un numéro de téléphone valide.');
      return;
    }
    if (dateOfBirth) {
      const parsed = new Date(`${dateOfBirth}T00:00:00.000Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || Number.isNaN(parsed.valueOf())
        || parsed.toISOString().slice(0, 10) !== dateOfBirth
        || dateOfBirth > new Date().toISOString().slice(0, 10)) {
        setPersonalInfoError('Saisissez une date de naissance valide.');
        return;
      }
    }
    setPersonalInfoError('');
    const saved = await updateProfile({ name, phone, dateOfBirth });
    if (saved) setIsEditInfoOpen(false);
  };

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

  const handleCancelApplication = async (application: Application) => {
    if (application.status !== 'EN_REVUE' || cancellingApplicationId) return;
    setCancellingApplicationId(application.id);
    try {
      const updated = await recruitmentService.cancelApplication(application.id);
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      showToast(t('recruitment.applicationCancelled'), 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('recruitment.cancelApplicationError'), 'error');
    } finally {
      setCancellingApplicationId(null);
    }
  };

  if (profileId && isLoadingPublicPlayer) return <div className="rounded-3xl border border-pitch-line bg-white p-8 text-sm text-slate-500">{t('profile.loading')}</div>;
  if (profileId && (publicPlayerNotFound || !publicPlayer)) return <div className="rounded-3xl border border-pitch-line bg-white p-8 text-sm text-slate-600">{t('profile.notFound')}</div>;
  if (isOwner && !user) return null;

  const displayedPlayer = isOwner ? myPlayer : publicPlayer;
  const displayedName = isOwner ? user!.name : publicPlayer!.name;
  const displayedAvatar = isOwner ? user!.avatarUrl : publicPlayer!.avatarUrl;
  const displayedTeam = isOwner ? user!.sportsCv.currentTeam : publicPlayer!.currentTeam;

  const displayedAge = isOwner ? user!.age ?? myPlayer?.age : displayedPlayer?.age;

  return (
    <div className="page-enter space-y-8 pb-16">
      {/* Profile Header */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-pitch-line bg-white shadow-xs">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-pitch-primary" />
        {isOwner && <button
          type="button"
          onClick={() => {
            setContactName(user!.name);
            setContactPhone(user!.phone ?? '');
            setDateOfBirth(user!.dateOfBirth ?? '');
            setPersonalInfoError('');
            setIsEditInfoOpen(true);
          }}
          aria-label="Modifier mes informations personnelles"
          title="Modifier mes informations"
          className="absolute right-4 top-5 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-pitch-line bg-white text-pitch-primary shadow-xs transition-colors hover:bg-pitch-panel-hover sm:right-6 sm:top-6"
        >
          <Edit3 className="h-4 w-4" />
        </button>}
        <div className="relative flex flex-col gap-6 p-5 pt-16 sm:p-7 sm:pt-16 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
              <img
                src={displayedAvatar}
                alt={displayedName}
                className="h-full w-full rounded-3xl border-2 border-pitch-primary bg-slate-100 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              {isOwner && <ImageUploadField
                purpose="avatar"
                label="Changer la photo"
                variant="avatar"
                onUploaded={(avatarUrl) => { void updateProfile({ avatarUrl }); }}
              />}
            </div>
            <div className="min-w-0 flex-1 space-y-4 lg:pr-14">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="break-words text-2xl font-black tracking-tight text-pitch-ink sm:text-3xl">{displayedName}</h1>
                {isOwner && myPlayer && <button
                  type="button"
                  onClick={() => navigate(`/profile/${encodeURIComponent(myPlayer.id)}`)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-pitch-line px-3 text-xs font-bold text-pitch-primary transition-colors hover:bg-pitch-panel-hover"
                >
                  <ExternalLink className="h-4 w-4" /> Voir le profil public
                </button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(isOwner ? user!.city : publicPlayer!.city) && <div className="min-w-0 rounded-2xl border border-pitch-line bg-pitch-panel p-3">
                  <span className="block text-caption font-semibold text-slate-500">{t('profile.city')}</span>
                  <span className="mt-1 flex min-w-0 items-center gap-2 break-words text-sm font-semibold text-pitch-ink"><MapPin className="h-4 w-4 shrink-0 text-pitch-primary" />{isOwner ? user!.city : publicPlayer!.city}</span>
                </div>}
                {(isOwner || publicPlayer!.email) && <div className="min-w-0 rounded-2xl border border-pitch-line bg-pitch-panel p-3">
                  <span className="block text-caption font-semibold text-slate-500">{t('profile.email')}</span>
                  <span className="mt-1 flex min-w-0 items-start gap-2 break-all text-sm font-semibold text-pitch-ink"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-pitch-primary" />{isOwner ? user!.email : publicPlayer!.email}</span>
                </div>}
                {(isOwner ? user!.phone?.trim() : publicPlayer!.phone?.trim()) && <div className="min-w-0 rounded-2xl border border-pitch-line bg-pitch-panel p-3">
                  <span className="block text-caption font-semibold text-slate-500">{t('profile.phone')}</span>
                  <span className="mt-1 flex min-w-0 items-center gap-2 break-words text-sm font-semibold text-pitch-ink"><Phone className="h-4 w-4 shrink-0 text-pitch-primary" />{isOwner ? user!.phone : publicPlayer!.phone}</span>
                </div>}
                {displayedAge !== undefined && displayedAge > 0 && <div className="min-w-0 rounded-2xl border border-pitch-line bg-pitch-panel p-3">
                  <span className="block text-caption font-semibold text-slate-500">{t('profile.age')}</span>
                  <span className="mt-1 block text-sm font-semibold text-pitch-ink">{t('profile.ageYears', { age: displayedAge })}</span>
                </div>}
              </div>
              <p className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl bg-pitch-panel px-3 py-2 text-sm text-slate-600">
                <span>{t('profile.officialTeam')}</span><strong className="text-pitch-ink">{displayedTeam || t('profile.noCurrentTeam')}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

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
                <h2 className="text-base font-extrabold text-pitch-ink">{t('profile.sportsCv')}</h2>
                <p className="text-xs text-slate-500">{isOwner ? t('profile.cvApplicationsNote') : t('profile.publicSportsProfile')}</p>
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
                <span>{t('profile.editCv')}</span>
              </button>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-slate-400 block text-caption font-semibold">{t('profile.primaryPosition')}</span>
                <strong className="text-pitch-ink text-sm block mt-0.5">{isOwner ? user!.sportsCv.primaryPosition : publicPlayer!.primaryPosition}</strong>
              </div>
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-slate-400 block text-caption font-semibold">{t('profile.strongFoot')}</span>
                <strong className="text-pitch-ink text-sm block mt-0.5">{isOwner ? user!.sportsCv.strongFoot : publicPlayer!.strongFoot}</strong>
              </div>
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-slate-400 block text-caption font-semibold">{t('profile.measurements')}</span>
                <strong className="text-pitch-ink text-sm tabular-nums block mt-0.5">
                  {isOwner ? user!.sportsCv.height : publicPlayer!.height} cm · {isOwner ? user!.sportsCv.weight : publicPlayer!.weight} kg
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line">
                <span className="text-slate-400 block text-caption font-semibold">{t('profile.experience')}</span>
                <strong className="text-pitch-ink text-sm tabular-nums block mt-0.5">
                  {isOwner
                    ? `${user!.sportsCv.experienceYears} ans`
                    : Number.isInteger(publicPlayer!.experienceYears) && publicPlayer!.experienceYears! > 0
                      ? `${publicPlayer!.experienceYears} ans`
                      : 'Non renseigné'}
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line text-xs text-slate-700 leading-relaxed">
              <h3 className="font-bold text-pitch-ink mb-1">{t('profile.sportsPresentation')}</h3>
              {isOwner ? user!.sportsCv.bio : publicPlayer!.bio}
            </div>
          </div>

          {displayedPlayer && <PlayerCareerPanel player={displayedPlayer} />}
          {displayedPlayer && <PhotoGallery entity="players" id={displayedPlayer.id} />}
          {isOwner && <RoleRequestsPanel />}
          {displayedPlayer && <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
            <h2 className="text-lg font-extrabold text-pitch-ink">{t('profile.clubCareer')}</h2>
            {displayedPlayer.previousClubs.length ? <ol className="mt-4 space-y-3 border-l-2 border-pitch-line pl-4">
              {displayedPlayer.previousClubs.map((club) => {
                const matchingTeam = teams.find((team) => team.name.toLowerCase() === club.toLowerCase())
                  ?? teams.find((team) => team.clubName?.toLowerCase() === club.toLowerCase());
                return <li key={club} className="text-sm font-semibold text-slate-700"><button type="button" onClick={() => matchingTeam ? navigate(`/teams/${encodeURIComponent(matchingTeam.id)}`) : navigate(`/teams?query=${encodeURIComponent(club)}`)} className="cursor-pointer text-left hover:text-pitch-primary hover:underline">{club}</button></li>;
              })}
            </ol> : <p className="mt-3 text-sm text-slate-500">{t('profile.noPreviousClubs')}</p>}
            {displayedPlayer.currentTeam && <p className="mt-3 text-sm font-bold text-pitch-primary">
              <button type="button" onClick={() => displayedPlayer.currentTeamId ? navigate(`/teams/${encodeURIComponent(displayedPlayer.currentTeamId)}`) : navigate(`/teams?query=${encodeURIComponent(displayedPlayer.currentTeam ?? '')}`)} className="cursor-pointer hover:underline">{displayedPlayer.currentTeam}</button> <span className="text-xs font-medium text-slate-500">(actuel)</span>
            </p>}
          </section>}
          {!isOwner && <p className="text-center text-xs text-slate-400">{t('profile.publicPrivacyNotice')}</p>}
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
                    {b.complexName} · <strong className="text-pitch-ink">{formatDateForDisplay(b.date)}</strong> à{' '}
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
                    <Badge variant={app.status === 'ACCEPTEE' ? 'emerald' : app.status === 'RETIRÉE' ? 'rose' : 'amber'} size="sm">
                      {app.status === 'EN_REVUE' ? t('recruitment.inReview') : app.status === 'ACCEPTEE' ? t('recruitment.accepted') : app.status === 'RETIRÉE' ? t('recruitment.withdrawn') : t('recruitment.rejected')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Club : <EntityLink section="teams" id={teams.find((team) => team.name === app.teamName)?.id}>{app.teamName}</EntityLink> · Candidat : {app.applicantName} ({app.applicantPosition})
                  </p>
                  <p className="text-xs text-slate-600 italic mt-1">« {app.message} »</p>
                </div>
                {app.status === 'EN_REVUE' && <button type="button" disabled={cancellingApplicationId !== null} onClick={() => void handleCancelApplication(app)} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60">
                  <XCircle className="h-4 w-4" aria-hidden="true" />{cancellingApplicationId === app.id ? t('recruitment.cancelling') : t('recruitment.cancelApplication')}
                </button>}
              </div>
            ))
          )}
        </div>
      )}

      {isEditInfoOpen && isOwner && <Modal
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        title="Mes informations personnelles"
        subtitle="Votre date de naissance reste privée. Elle sert uniquement à calculer votre âge."
        maxWidth="md"
      >
        <form onSubmit={handleSavePersonalInfo} className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Nom affiché
            <input
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-panel px-3 text-sm text-pitch-ink focus:border-pitch-primary"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Numéro de téléphone
            <input
              type="tel"
              autoComplete="tel"
              maxLength={32}
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="Ex. +261 34 00 000 00"
              className="mt-1 min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-panel px-3 text-sm text-pitch-ink focus:border-pitch-primary"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Date de naissance
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-panel px-3 text-sm text-pitch-ink focus:border-pitch-primary"
            />
          </label>
          {personalInfoError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{personalInfoError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsEditInfoOpen(false)} className="min-h-11 rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-100">{t('common.cancel')}</button>
            <button type="submit" className="min-h-11 rounded-xl bg-pitch-action px-4 text-xs font-bold text-white hover:bg-pitch-action-hover">{t('common.save')}</button>
          </div>
        </form>
      </Modal>}

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
              <SelectField
                value={cvPosition}
                onChange={(e) => setCvPosition(e.target.value as Position)}
                required
                disabled={!positionOptions.length}
                className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
              >
                <option value="" disabled>{t('profile.choosePosition')}</option>
                {positionOptions.map((position) => <option key={position} value={position}>{position}</option>)}
              </SelectField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('profile.height')}</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('profile.weight')}</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('profile.strongFoot')}</label>
                <SelectField
                  value={cvFoot}
                  onChange={(e) => setCvFoot(e.target.value as StrongFoot)}
                  required
                  disabled={!strongFootOptions.length}
                  className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
                >
                  <option value="" disabled>{t('profile.chooseStrongFoot')}</option>
                  {strongFootOptions.map((foot) => <option key={foot} value={foot}>{foot}</option>)}
                </SelectField>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('profile.currentClub')}</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('profile.sportsBio')}</label>
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
