import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { formatFiniteNumber } from '../../../utils/numberFormat';

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

interface SelectedPitchSlot {
  slot: PitchSlot;
  date: string;
}

export const PitchesView: React.FC = () => {
  const { showToast, selectedResourceId, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { pitchId: routePitchId } = useParams();
  const isBookingRoute = location.pathname.endsWith('/book');
  const pitchModal = useRouteModal('/pitches');
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const hasLoadedPitches = useRef(false);
  const pitchRequestId = useRef(0);
  const [surfaceFilter, setSurfaceFilter] = useState<SurfaceType | 'Toutes'>('Toutes');
  const [cityFilter, setCityFilter] = useState('Toutes');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Pitch for booking
  const selectedPitch = isBookingRoute && routePitchId
    ? pitches.find((pitch) => pitch.id === routePitchId) ?? null
    : null;
  const detailPitch = routePitchId && !isBookingRoute && pitchModal.mode !== 'create'
    ? pitches.find((pitch) => pitch.id === routePitchId) ?? null
    : null;

  // Booking Flow State
  const [bookingDate, setBookingDate] = useState('Samedi 24 Octobre 2026');
  const [selectedSlots, setSelectedSlots] = useState<SelectedPitchSlot[]>([]);
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
      const requestId = ++pitchRequestId.current;
      // Keep the current pitch mounted while refreshing date-specific availability.
      setIsLoading(!hasLoadedPitches.current);
      try {
        const data = await pitchesService.list({
          surface: surfaceFilter,
          city: cityFilter,
          date: routePitchId ? bookingDate : undefined,
        });
        if (requestId !== pitchRequestId.current) return;
        setPitches(data);
        hasLoadedPitches.current = true;

      } catch (err: any) {
        if (requestId !== pitchRequestId.current) return;
        showToast(err.message || 'Erreur lors du chargement des terrains', 'error');
      } finally {
        if (requestId === pitchRequestId.current) setIsLoading(false);
      }
    }
    loadPitches();
  }, [surfaceFilter, cityFilter, selectedResourceId, showToast, routePitchId, bookingDate]);

  useEffect(() => {
    if (!selectedPitch) return;
    const firstAvailable = selectedPitch.availableSlots.find((slot) => slot.isAvailable);
    if (firstAvailable && !selectedSlots.some((selected) => selected.date === bookingDate)) {
      setSelectedSlots((current) => [...current, { slot: firstAvailable, date: bookingDate }]);
    }
  }, [selectedPitch?.id]);

  useEffect(() => {
    if (!isBookingRoute) setSelectedSlots([]);
  }, [routePitchId, isBookingRoute]);

  const toggleSlot = (slot: PitchSlot) => {
    if (!slot.isAvailable) return;
    setSelectedSlots((current) => current.some((selected) => selected.date === bookingDate && selected.slot.id === slot.id)
      ? current.filter((selected) => selected.date !== bookingDate || selected.slot.id !== slot.id)
      : [...current, { slot, date: bookingDate }]);
  };

  const handleBookingDateChange = (date: string) => {
    if (date === bookingDate) return;
    setBookingDate(date);
  };

  const handleOpenBooking = (pitch: Pitch, slot?: PitchSlot) => {
    const firstAvail = pitch.availableSlots.find((s) => s.isAvailable);
    const initialSlot = slot ?? firstAvail;
    setSelectedSlots(initialSlot ? [{ slot: initialSlot, date: bookingDate }] : []);
    setTeamName(user?.sportsCv.currentTeam || '');
    navigate(`/pitches/${encodeURIComponent(pitch.id)}/book`);
  };

  const handleConfirmBooking = async () => {
    if (!selectedPitch || !selectedSlots.length) return;
    setIsSubmitting(true);
    let completedCount = 0;
    try {
      for (const slot of selectedSlots) {
        await bookingsService.requestBooking({
          pitchId: selectedPitch.id,
          date: slot.date,
          time: slot.slot.time,
          teamName: teamName.trim() || undefined,
          totalPrice: slot.slot.price,
        });
        completedCount += 1;
      }

      showToast(`${completedCount} créneau(x) confirmé(s) sur ${selectedPitch.name}.`, 'success');
      navigate(`/pitches/${encodeURIComponent(selectedPitch.id)}`, { replace: true });
      setSelectedSlots([]);
    } catch (e: any) {
      if (completedCount) {
        setSelectedSlots((current) => current.slice(completedCount));
        showToast(`${completedCount} créneau(x) réservé(s), les suivants ont échoué : ${e.message || 'erreur inconnue'}`, 'error');
        return;
      }
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
    if (!Number.isFinite(rate) || rate <= 0) {
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
      navigate(`/pitches/${encodeURIComponent(created.id)}`, { replace: true });
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
  const selectedSlotsByDate = selectedSlots.reduce<Record<string, PitchSlot[]>>((groups, selection) => {
    (groups[selection.date] ??= []).push(selection.slot);
    return groups;
  }, {});
  const selectedSlotsTotal = selectedSlots.reduce((total, selection) => total + selection.slot.price, 0);
  const selectedSlotsForCurrentDate = selectedSlots.filter((selection) => selection.date === bookingDate);
  const currentDateTotal = selectedSlotsForCurrentDate.reduce((total, selection) => total + selection.slot.price, 0);

  if (routePitchId && !isBookingRoute && pitchModal.mode !== 'create') {
    if (isLoading) return <CardSkeleton />;
    if (!detailPitch) {
      return <EmptyState icon={MapPin} title="Terrain introuvable" description="Ce terrain n’existe pas ou n’est plus disponible." />;
    }

    return (
      <div className="space-y-6 pb-16">
        <button type="button" onClick={() => navigate('/pitches')} className="text-sm font-bold text-[#0e5632] hover:underline">← Retour aux terrains</button>
        <section className="overflow-hidden rounded-3xl border border-[#dce6d8] bg-white shadow-xs">
          <div className="relative h-64 sm:h-80 lg:h-[420px]">
            <img src={detailPitch.imageUrl} alt={detailPitch.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <p className="text-sm font-bold text-lime-300">{detailPitch.complexName}</p>
              <h1 className="mt-1 text-2xl font-extrabold md:text-4xl">{detailPitch.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/90"><MapPin className="h-4 w-4" />{detailPitch.address}, {detailPitch.city}</p>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-7">
            <div className="rounded-2xl border border-[#dce6d8] bg-[#f8faf7] p-4"><span className="text-xs text-slate-500">Surface</span><strong className="mt-1 block text-sm text-[#092c1a]">{detailPitch.surface}</strong></div>
            <div className="rounded-2xl border border-[#dce6d8] bg-[#f8faf7] p-4"><span className="text-xs text-slate-500">Dimensions</span><strong className="mt-1 block text-sm text-[#092c1a]">{detailPitch.dimensions}</strong></div>
            <div className="rounded-2xl border border-[#dce6d8] bg-[#f8faf7] p-4"><span className="text-xs text-slate-500">Évaluation</span><strong className="mt-1 flex items-center gap-1 text-sm text-[#092c1a]"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{formatFiniteNumber(detailPitch.rating, 1)} ({formatFiniteNumber(detailPitch.reviewsCount)} avis)</strong></div>
            <div className="rounded-2xl border border-[#dce6d8] bg-[#f8faf7] p-4"><span className="text-xs text-slate-500">Tarif indicatif</span><strong className="mt-1 block text-sm text-[#0e5632]">À partir de {formatFiniteNumber(detailPitch.hourlyRate)} € / séance</strong></div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-[#dce6d8] bg-white p-5 shadow-xs md:p-6">
            <h2 className="text-lg font-extrabold text-[#092c1a]">Équipements et services</h2>
            {detailPitch.amenities.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {detailPitch.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 shrink-0 text-[#0e5632]" />{amenity}</li>)}
            </ul> : <p className="mt-3 text-sm text-slate-500">Aucun équipement renseigné.</p>}
          </div>
          <div className="rounded-3xl border border-[#dce6d8] bg-white p-5 shadow-xs md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-extrabold text-[#092c1a]">Créneaux disponibles</h2><p className="mt-1 text-xs text-slate-500">Sélectionnez un ou plusieurs créneaux à réserver.</p></div>
              <Calendar className="h-5 w-5 text-[#0e5632]" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Date des créneaux">
              {dateOptions.map((date) => <button key={date} type="button" onClick={() => handleBookingDateChange(date)} aria-pressed={bookingDate === date} className={`rounded-xl border px-3 py-2 text-xs font-bold ${bookingDate === date ? 'border-[#0e5632] bg-[#0e5632] text-white' : 'border-[#dce6d8] bg-white text-[#0e5632]'}`}>{date}</button>)}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {detailPitch.availableSlots.map((slot) => {
                const isSelected = selectedSlots.some((selected) => selected.date === bookingDate && selected.slot.id === slot.id);
                return <div key={slot.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce6d8] bg-[#f8faf7] p-3">
                  <div><strong className="block text-sm text-[#092c1a]">{slot.time}</strong><span className="mt-1 block text-xs text-slate-500">{slot.price} € · 1h30</span></div>
                  <button type="button" disabled={!slot.isAvailable} aria-pressed={isSelected} onClick={() => toggleSlot(slot)} className={`rounded-xl px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:bg-slate-300 ${isSelected ? 'bg-[#0e4d2e] text-white' : 'border border-[#dce6d8] bg-white text-[#0e5632] hover:bg-[#f2f8f0]'}`}>{!slot.isAvailable ? 'Indisponible' : isSelected ? 'Sélectionné' : 'Sélectionner'}</button>
                </div>;
              })}
              {!detailPitch.availableSlots.some((slot) => slot.isAvailable) && <p className="text-sm text-slate-500">Aucun créneau disponible pour cette date.</p>}
            </div>
            {selectedSlots.length > 0 && <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[#edf3ea] pt-4 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-600"><strong className="text-[#092c1a]">{selectedSlots.length}</strong> créneau(x) sélectionné(s) · <strong className="text-[#0e5632]">{selectedSlotsTotal} €</strong> au total</p>
              <button type="button" onClick={() => { setTeamName(user?.sportsCv.currentTeam || ''); navigate(`/pitches/${encodeURIComponent(detailPitch.id)}/book`); }} className="rounded-xl bg-[#0e4d2e] px-4 py-3 text-sm font-bold text-white hover:bg-[#0a3a23]">Réserver les créneaux sélectionnés</button>
            </div>}
          </div>
        </section>
      </div>
    );
  }

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
            onClick={() => navigate('/profile/bookings')}
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
              onClick={() => navigate(`/pitches/${encodeURIComponent(pitch.id)}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/pitches/${encodeURIComponent(pitch.id)}`);
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
                    <span>{formatFiniteNumber(pitch.rating, 1)}</span>
                    <span className="text-white/60 font-medium">({formatFiniteNumber(pitch.reviewsCount)})</span>
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
                    {formatFiniteNumber(pitch.hourlyRate)} €
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
            navigate(`/pitches/${encodeURIComponent(selectedPitch.id)}`, { replace: true });
            setSelectedSlots([]);
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
                    onClick={() => handleBookingDateChange(date)}
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
                  const isSelected = selectedSlots.some((selected) => selected.date === bookingDate && selected.slot.id === slot.id);
                  return (
                    <button
                      key={slot.id}
                      disabled={!slot.isAvailable}
                      onClick={() => toggleSlot(slot)}
                      aria-pressed={isSelected}
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

            {selectedSlotsForCurrentDate.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6d8] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">{selectedSlotsForCurrentDate.length} créneau(x) · total</span>
                  <span className="text-xl font-extrabold text-[#0e5632] tabular-nums">
                    {currentDateTotal} € TTC
                  </span>
                </div>
                <div className="text-right text-slate-500">
                  <span>{bookingDate}</span>
                  <span className="block font-bold text-[#092c1a]">{selectedSlotsForCurrentDate.map((selection) => selection.slot.time).join(' · ')}</span>
                </div>
              </div>
            )}

            {selectedSlots.length > 0 && <aside className="rounded-2xl border border-[#dce6d8] bg-white p-4" aria-label="Récapitulatif des créneaux sélectionnés">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold text-[#092c1a]">Rappel de votre sélection</p>
                <p className="text-xs font-bold text-[#0e5632]">{selectedSlots.length} créneau(x) · {selectedSlotsTotal} €</p>
              </div>
              <ul className="mt-2 space-y-1.5">
                {Object.entries(selectedSlotsByDate).map(([date, slots]) => <li key={date} className="flex flex-wrap justify-between gap-x-3 text-xs text-slate-600">
                  <span className="font-semibold">{date}</span><span>{slots.map((slot) => slot.time).join(' · ')}</span>
                </li>)}
              </ul>
            </aside>}

            <div className="pt-2">
              <button
                onClick={handleConfirmBooking}
                disabled={!selectedSlots.length || isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#0e4d2e] hover:bg-[#0a3a23] text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Validation...' : `Valider ${selectedSlots.length} créneau(x)`}
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
