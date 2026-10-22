import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Star, Shield, Check, Plus, Building2, CheckSquare, Square, Sparkles } from 'lucide-react';
import { pitchesService, CreatePitchInput } from '../../../services/pitchesService';
import { bookingsService } from '../../../services/bookingsService';
import { Pitch, PitchSlot, SurfaceType } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { useApp } from '../../../context/useApp';
import { useRouteModal } from '../../../hooks/useRouteModal';

const PITCH_IMAGE_PRESETS = [
  {
    name: 'Synthétique Pro FIFA',
    url: 'https://images.unsplash.com/photo-1529900240041-22f1a66a3d6d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Pelouse naturelle d\'honneur',
    url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Arène Five Indoor',
    url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'Nocturne sous projecteurs',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
  },
];

const AVAILABLE_AMENITIES = [
  'Vestiaires avec douches chaudes',
  'Éclairage nocturne LED',
  'Parking gratuit surveillé',
  'Buvette & Club House',
  'Tribunes abritées',
  'Caméras vidéo HD Replay',
  'Chronomètre & Tableau d\'affichage',
  'Ballons & Chasubles fournis',
];

export const PitchesView: React.FC = () => {
  const { showToast, selectedResourceId, user, navigateToResource } = useApp();
  const pitchModal = useRouteModal('/pitches');
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [surfaceFilter, setSurfaceFilter] = useState<SurfaceType | 'Toutes'>('Toutes');
  const [cityFilter, setCityFilter] = useState('Toutes');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Pitch for booking
  const selectedPitch = pitchModal.resourceId
    ? pitches.find((pitch) => pitch.id === pitchModal.resourceId) ?? null
    : null;

  // Booking Flow State
  const [bookingDate, setBookingDate] = useState('Samedi 24 Octobre 2026');
  const [selectedSlot, setSelectedSlot] = useState<PitchSlot | null>(null);
  const [teamName, setTeamName] = useState(user?.sportsCv.currentTeam || '');
  const [phone, setPhone] = useState(user?.phone || '06 12 34 56 78');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Pitch Modal State
  const [formName, setFormName] = useState('');
  const [formComplexName, setFormComplexName] = useState('Complexe Sportif Municipal');
  const [formCity, setFormCity] = useState(user?.city || 'Fianarantsoa');
  const [formAddress, setFormAddress] = useState('Boulevard de la Liberté');
  const [formSurface, setFormSurface] = useState<SurfaceType>('Synthétique dernière génération');
  const [formDimensions, setFormDimensions] = useState('105m x 68m (11v11)');
  const [formHourlyRate, setFormHourlyRate] = useState('50');
  const [formAmenities, setFormAmenities] = useState<string[]>([
    'Vestiaires avec douches chaudes',
    'Éclairage nocturne LED',
    'Parking gratuit surveillé',
    'Buvette & Club House',
  ]);
  const [formImageUrl, setFormImageUrl] = useState(PITCH_IMAGE_PRESETS[0].url);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadPitches() {
      setIsLoading(true);
      try {
        const data = await pitchesService.list({
          surface: surfaceFilter,
          city: cityFilter,
        });
        setPitches(data);

        if (selectedResourceId) {
          const match = data.find((p) => p.id === selectedResourceId);
          if (match) {
            const firstAvail = match.availableSlots.find((s) => s.isAvailable);
            if (firstAvail) setSelectedSlot(firstAvail);
          }
        }
      } catch (err: any) {
        showToast(err.message || 'Erreur lors du chargement des terrains', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadPitches();
  }, [surfaceFilter, cityFilter, selectedResourceId, showToast]);

  const handleOpenBooking = (pitch: Pitch) => {
    pitchModal.openDetail(pitch.id);
    const firstAvail = pitch.availableSlots.find((s) => s.isAvailable);
    setSelectedSlot(firstAvail || null);
    setTeamName(user?.sportsCv.currentTeam || '');
  };

  const handleConfirmBooking = async () => {
    if (!selectedPitch || !selectedSlot) return;
    setIsSubmitting(true);
    try {
      await bookingsService.requestBooking({
        pitchId: selectedPitch.id,
        date: bookingDate,
        time: selectedSlot.time,
        teamName: teamName.trim() || undefined,
        totalPrice: selectedSlot.price,
      });

      showToast(`Créneau confirmé à ${selectedPitch.name} le ${bookingDate} !`, 'success');
      pitchModal.close();
      setSelectedSlot(null);
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la réservation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (item: string) => {
    setFormAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleCreatePitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComplexName.trim() || !formAddress.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires du terrain.', 'info');
      return;
    }

    const rate = parseFloat(formHourlyRate);
    if (isNaN(rate) || rate <= 0) {
      showToast('Veuillez indiquer un tarif horaire valide.', 'info');
      return;
    }

    setIsCreating(true);
    try {
      // Build default initial available slots
      const initialSlots: PitchSlot[] = [
        { id: `slot_${Date.now()}_1`, time: '09:00 - 10:30', price: rate, isAvailable: true },
        { id: `slot_${Date.now()}_2`, time: '14:00 - 15:30', price: rate, isAvailable: true },
        { id: `slot_${Date.now()}_3`, time: '18:00 - 19:30', price: Math.round(rate * 1.1), isAvailable: true },
        { id: `slot_${Date.now()}_4`, time: '20:00 - 21:30', price: Math.round(rate * 1.15), isAvailable: true },
      ];

      const input: CreatePitchInput = {
        name: formName.trim(),
        complexName: formComplexName.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
        surface: formSurface,
        dimensions: formDimensions.trim(),
        imageUrl: formImageUrl || PITCH_IMAGE_PRESETS[0].url,
        hourlyRate: rate,
        amenities: formAmenities.length > 0 ? formAmenities : ['Éclairage nocturne LED', 'Vestiaires'],
        availableSlots: initialSlots,
      };

      const created = await pitchesService.create(input);
      showToast(`Terrain "${created.name}" ajouté avec succès !`, 'success');
      // Reset form fields
      setFormName('');
      setFormHourlyRate('50');

      // Reload the list and open the newly created pitch through its URL.
      const updated = await pitchesService.list();
      setPitches(updated);
      pitchModal.openDetail(created.id, true);
      setSelectedSlot(created.availableSlots.find((slot) => slot.isAvailable) ?? null);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l’ajout du terrain', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const surfaces: (SurfaceType | 'Toutes')[] = [
    'Toutes',
    'Synthétique dernière génération',
    'Gazon naturel',
    'Indoor Five',
    'Futsal parquet',
  ];

  const dateOptions = [
    'Samedi 24 Octobre 2026',
    'Dimanche 25 Octobre 2026',
    'Mercredi 28 Octobre 2026',
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#092c1a] tracking-tight">
            Terrains & Complexes
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Réservez vos créneaux en direct ou déclarez votre infrastructure sportive sur Footera.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={pitchModal.openCreate}
            className="px-4 py-2 min-h-[44px] rounded-2xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un terrain</span>
          </button>
          <button
            onClick={() => navigateToResource('profile')}
            className="px-4 py-2 min-h-[44px] rounded-2xl bg-white hover:bg-slate-50 text-[#092c1a] text-xs font-bold border border-[#dce6d8] shadow-2xs cursor-pointer"
          >
            Mes réservations
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-3xl bg-white border border-[#dce6d8] grid grid-cols-1 md:grid-cols-2 gap-3 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Type de surface</label>
          <select
            value={surfaceFilter}
            onChange={(e) => setSurfaceFilter(e.target.value as any)}
            className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-full px-4 py-2.5 text-xs md:text-sm text-[#092c1a] focus:border-[#0e5632] outline-hidden"
          >
            {surfaces.map((s) => (
              <option key={s} value={s}>
                {s === 'Toutes' ? 'Toutes les surfaces' : s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Localisation</label>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full bg-[#f6f8f5] border border-[#dce6d8] rounded-full px-4 py-2.5 text-xs md:text-sm text-[#092c1a] focus:border-[#0e5632] outline-hidden"
          >
            <option value="Toutes">Toutes les villes</option>
            <option value="Fianarantsoa">Fianarantsoa</option>
            <option value="Antananarivo">Antananarivo</option>
            <option value="Toamasina">Toamasina</option>
            <option value="Paris">Paris</option>
          </select>
        </div>
      </div>

      {/* Pitches Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : pitches.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aucun terrain trouvé"
          description="Modifiez vos critères de surface ou de ville, ou ajoutez un nouveau terrain."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pitches.map((pitch) => (
            <div
              key={pitch.id}
              onClick={() => handleOpenBooking(pitch)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleOpenBooking(pitch);
                }
              }}
              role="link"
              tabIndex={0}
              aria-label={`Voir le terrain ${pitch.name} et réserver`}
              className="rounded-3xl bg-white border border-[#dce6d8] hover:border-[#0e5632]/50 overflow-hidden transition-all cursor-pointer group shadow-xs flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-[#0e5632]"
            >
              <div>
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={pitch.imageUrl}
                    alt={pitch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#092c1a]/85 backdrop-blur-xs text-[#c6f432] px-2.5 py-1 rounded-full text-xs font-extrabold shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-[#c6f432]" />
                    <span>{pitch.rating.toFixed(1)}</span>
                    <span className="text-white/60 font-medium">({pitch.reviewsCount})</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-xs font-bold text-[#c6f432] block mb-0.5">
                      {pitch.surface} · {pitch.dimensions}
                    </span>
                    <h3 className="text-lg font-extrabold text-white truncate">
                      {pitch.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center text-xs text-slate-600 gap-1.5">
                    <MapPin className="w-4 h-4 text-[#0e5632] shrink-0" />
                    <span className="truncate">{pitch.address}, {pitch.city}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pitch.amenities.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 bg-[#f8faf7] border border-[#e2ebe0] text-[#092c1a] rounded-lg text-[11px] font-medium"
                      >
                        {a}
                      </span>
                    ))}
                    {pitch.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold">
                        +{pitch.amenities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#f8faf7] border-t border-[#edf3ea] flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">À partir de</span>
                  <span className="text-lg font-extrabold text-[#0e5632] tabular-nums">
                    {pitch.hourlyRate} €
                  </span>
                  <span className="text-xs text-slate-500 font-medium"> / séance</span>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenBooking(pitch);
                  }}
                  className="px-4 py-2 bg-[#0e4d2e] group-hover:bg-[#0a3a23] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Réserver créneau
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedPitch && (
        <Modal
          isOpen={!!selectedPitch}
          onClose={() => {
            pitchModal.close();
            setSelectedSlot(null);
          }}
          title={`Réserver ${selectedPitch.name}`}
          subtitle={`${selectedPitch.complexName} · ${selectedPitch.address}, ${selectedPitch.city}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sélectionnez une date
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {dateOptions.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setBookingDate(date)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      bookingDate === date
                        ? 'border-[#0e5632] bg-[#f2f7f0] text-[#0e5632] ring-1 ring-[#0e5632]'
                        : 'border-[#dce6d8] bg-white text-slate-700 hover:border-[#0e5632]'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mb-1 text-[#0e5632]" />
                    <span className="block">{date}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Créneaux disponibles (1h30)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedPitch.availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-2xl border text-xs flex flex-col justify-between transition-all cursor-pointer ${
                        !slot.isAvailable
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                          : isSelected
                          ? 'bg-[#0e5632] border-[#0e5632] text-white shadow-xs'
                          : 'bg-white border-[#dce6d8] text-[#092c1a] hover:border-[#0e5632]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-extrabold tabular-nums">{slot.price} €</span>
                      </div>
                      <span className="font-bold mt-2 block">{slot.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedSlot && (
              <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Tarif total</span>
                  <span className="text-xl font-extrabold text-[#0e5632] tabular-nums">
                    {selectedSlot.price} € TTC
                  </span>
                </div>
                <div className="text-right text-slate-500">
                  <span>{bookingDate}</span>
                  <span className="block font-bold text-[#092c1a]">{selectedSlot.time}</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleConfirmBooking}
                disabled={!selectedSlot || isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Validation...' : 'Valider la réservation du terrain'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Pitch Modal */}
      {pitchModal.mode === 'create' && (
        <Modal
          isOpen={pitchModal.mode === 'create'}
          onClose={pitchModal.close}
          title="Ajouter un terrain ou complexe"
          subtitle="Proposez votre terrain à la communauté pour réservations et matchs"
          maxWidth="lg"
        >
          <form onSubmit={handleCreatePitch} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du terrain *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Terrain Synthétique Élite Matsiatra"
                  className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du Complexe ou Club *
                </label>
                <input
                  type="text"
                  required
                  value={formComplexName}
                  onChange={(e) => setFormComplexName(e.target.value)}
                  placeholder="Ex: Complexe Omnisports Municipal"
                  className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville *</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Ex: Fianarantsoa"
                  className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse exacte *</label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ex: Boulevard de la Liberté, Ampasambazaha"
                  className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type de surface *</label>
                <select
                  value={formSurface}
                  onChange={(e) => setFormSurface(e.target.value as SurfaceType)}
                  className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] outline-hidden"
                >
                  <option value="Synthétique dernière génération">Synthétique dernière génération</option>
                  <option value="Gazon naturel">Gazon naturel</option>
                  <option value="Indoor Five">Indoor Five (Salle)</option>
                  <option value="Futsal parquet">Futsal parquet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions *</label>
                <input
                  type="text"
                  required
                  value={formDimensions}
                  onChange={(e) => setFormDimensions(e.target.value)}
                  placeholder="105m x 68m (11v11)"
                  className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tarif horaire (€) *</label>
                <input
                  type="number"
                  required
                  min="5"
                  step="5"
                  value={formHourlyRate}
                  onChange={(e) => setFormHourlyRate(e.target.value)}
                  placeholder="50"
                  className="w-full p-3 bg-[#f8faf7] border border-[#dce6d8] rounded-2xl text-xs text-[#092c1a] focus:border-[#0e5632] outline-hidden"
                />
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Équipements et commodités du complexe
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_AMENITIES.map((item) => {
                  const isChecked = formAmenities.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleAmenity(item)}
                      className={`p-2.5 rounded-xl border text-left text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'border-[#0e5632] bg-[#f2f7f0] text-[#0e5632] font-bold'
                          : 'border-[#dce6d8] bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#0e5632] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image Preset Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Photo principale du terrain
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PITCH_IMAGE_PRESETS.map((preset) => {
                  const isSelected = formImageUrl === preset.url;
                  return (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() => setFormImageUrl(preset.url)}
                      className={`relative h-20 rounded-2xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                        isSelected ? 'border-[#0e5632] ring-2 ring-[#c6f432]' : 'border-transparent hover:opacity-90'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                        <span className="text-[11px] font-bold text-white leading-tight">
                          {preset.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#c6f432] text-[#092c1a] flex items-center justify-center font-bold text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#edf3ea]">
              <button
                type="button"
                onClick={pitchModal.close}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 min-h-[44px] rounded-xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCreating ? 'Ajout en cours...' : 'Enregistrer le terrain'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
