import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Trophy
} from 'lucide-react';
import { useApp } from '../../../context/useApp';
import { bookingsService } from '../../../services/bookingsService';
import { recruitmentService } from '../../../services/recruitmentService';
import { Booking, Application, UserRole, Position, StrongFoot } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';

export const ProfileView: React.FC = () => {
  const { user, switchRole, updateSportsCv, resetDemo, showToast, selectedResourceId } = useApp();
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
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Edit CV modal
  const [cvPosition, setCvPosition] = useState<Position>(user?.sportsCv.primaryPosition || 'Milieu Central');
  const [cvHeight, setCvHeight] = useState(user?.sportsCv.height || 180);
  const [cvWeight, setCvWeight] = useState(user?.sportsCv.weight || 75);
  const [cvFoot, setCvFoot] = useState<StrongFoot>(user?.sportsCv.strongFoot || 'Droitier');
  const [cvBio, setCvBio] = useState(user?.sportsCv.bio || '');
  const [cvCurrentTeam, setCvCurrentTeam] = useState(user?.sportsCv.currentTeam || '');

  useEffect(() => {
    async function loadUserData() {
      setIsLoadingData(true);
      try {
        const [b, a] = await Promise.all([
          bookingsService.list(),
          recruitmentService.listMyApplications(),
        ]);
        setBookings(b);
        setApplications(a);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('Failed to load profile sub-data:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadUserData();
  }, []);

  const handleSaveCv = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSportsCv({
      primaryPosition: cvPosition,
      height: Number(cvHeight),
      weight: Number(cvWeight),
      strongFoot: cvFoot,
      bio: cvBio,
      currentTeam: cvCurrentTeam,
    });
    navigate('/profile', { replace: true });
  };

  const closeEditCv = () => navigate('/profile', { replace: true });

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const ok = await bookingsService.cancelBooking(bookingId);
      if (ok) {
        showToast('Réservation annulée avec succès');
        const updated = await bookingsService.list();
        setBookings(updated);
      }
    } catch {
      showToast('Erreur lors de l’annulation', 'error');
    }
  };

  if (!user) return null;

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
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#dce6d8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-slate-100 border-2 border-[#0e5632] shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-[#092c1a] tracking-tight">
                {user.name}
              </h1>
              <Badge variant="emerald" size="sm">
                {user.activeRole}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0e5632]" />
                {user.city}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#0e5632]" />
                {user.email}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#0e5632]" />
                {user.phone}
              </span>
            </div>
            <p className="text-xs text-slate-600 pt-1">
              Équipe officielle : <strong className="text-[#092c1a]">{user.sportsCv.currentTeam}</strong>
            </p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8] space-y-2 w-full md:w-auto">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">
            Rôle actif actuel :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {rolesAvailable.map((r) => {
              const isActive = user.activeRole === r;
              return (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0e5632] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-[#dce6d8]'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#dce6d8] pb-2">
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
                ? 'bg-[#0e5632] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#092c1a]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: CV Sportif */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#dce6d8] space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#092c1a]">CV Sportif Vérifié</h2>
                <p className="text-xs text-slate-500">Transmis lors de vos candidatures d&apos;équipe</p>
              </div>
              <button
                onClick={() => {
                  setCvPosition(user.sportsCv.primaryPosition);
                  setCvHeight(user.sportsCv.height);
                  setCvWeight(user.sportsCv.weight);
                  setCvFoot(user.sportsCv.strongFoot);
                  setCvBio(user.sportsCv.bio);
                  setCvCurrentTeam(user.sportsCv.currentTeam);
                  navigate('/profile/edit-cv');
                }}
                className="px-4 py-2 min-h-[44px] rounded-2xl bg-[#eaf4ed] hover:bg-[#d5edd9] text-[#0e5632] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier mon CV</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-slate-400 block text-[11px] font-semibold">Poste principal</span>
                <strong className="text-[#092c1a] text-sm block mt-0.5">{user.sportsCv.primaryPosition}</strong>
              </div>
              <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-slate-400 block text-[11px] font-semibold">Pied fort</span>
                <strong className="text-[#092c1a] text-sm block mt-0.5">{user.sportsCv.strongFoot}</strong>
              </div>
              <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-slate-400 block text-[11px] font-semibold">Mensurations</span>
                <strong className="text-[#092c1a] text-sm tabular-nums block mt-0.5">
                  {user.sportsCv.height} cm · {user.sportsCv.weight} kg
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8]">
                <span className="text-slate-400 block text-[11px] font-semibold">Expérience</span>
                <strong className="text-[#092c1a] text-sm tabular-nums block mt-0.5">
                  {user.sportsCv.experienceYears} ans
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8] text-xs text-slate-700 leading-relaxed">
              <h3 className="font-bold text-[#092c1a] mb-1">Présentation sportive :</h3>
              {user.sportsCv.bio}
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="p-5 rounded-3xl bg-[#fdf2f2] border border-[#fecaca] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-800">Données de test locales</h3>
              <p className="text-xs text-rose-600 mt-0.5">
                Restaurez les fixtures d&apos;origine du projet Footera (équipes Betsileo FC, AS Analakely, etc.).
              </p>
            </div>
            <button
              onClick={resetDemo}
              className="px-4 py-2 min-h-[44px] rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser les données</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-[#dce6d8]">
              Aucune réservation active.
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className={`p-5 rounded-3xl bg-white border border-[#dce6d8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${selectedResourceId === b.id ? 'ring-2 ring-[#c6f432]' : ''}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[#092c1a]">{b.pitchName}</h2>
                    <Badge
                      variant={b.status === 'CONFIRMED' ? 'emerald' : b.status === 'PENDING' ? 'amber' : 'rose'}
                      size="sm"
                    >
                      {b.status === 'CONFIRMED' ? 'Confirmée' : b.status === 'PENDING' ? 'En attente' : 'Annulée'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {b.complexName} · <strong className="text-[#092c1a]">{b.date}</strong> à{' '}
                    <strong className="text-[#0e5632]">{b.time}</strong>
                  </p>
                  <p className="text-xs text-slate-600">Montant total : {b.totalPrice} € TTC</p>
                </div>

                {b.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="px-4 py-2 min-h-[44px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-[#dce6d8]">
              Aucune candidature transmise.
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-3xl bg-white border border-[#dce6d8] flex items-start justify-between shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-[#092c1a]">{app.adTitle}</h2>
                    <Badge variant={app.status === 'ACCEPTEE' ? 'emerald' : 'amber'} size="sm">
                      {app.status === 'EN_REVUE' ? 'En cours d’examen' : 'Acceptée'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Club : {app.teamName} · Candidat : {app.applicantName} ({app.applicantPosition})
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
                className="w-full p-2.5 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632]"
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
                  value={cvHeight}
                  onChange={(e) => setCvHeight(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Poids (kg)</label>
                <input
                  type="number"
                  value={cvWeight}
                  onChange={(e) => setCvWeight(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pied fort</label>
                <select
                  value={cvFoot}
                  onChange={(e) => setCvFoot(e.target.value as any)}
                  className="w-full p-2.5 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632]"
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
                placeholder="Ex: Betsileo FC"
                className="w-full p-2.5 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio sportive</label>
              <textarea
                rows={3}
                value={cvBio}
                onChange={(e) => setCvBio(e.target.value)}
                className="w-full p-2.5 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={closeEditCv}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 min-h-[44px] rounded-xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer mon CV</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
