import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Calendar, Clock, Star, Shield, Check, Plus, Building2, CheckSquare, Square, Sparkles } from 'lucide-react';
import { pitchesService, CreatePitchInput } from '../../../services/pitchesService';
import { BookingQuote, bookingsService } from '../../../services/bookingsService';
import { Pitch, PitchSlot, SurfaceType } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { useApp } from '../../../context/useApp';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { formatFiniteNumber } from '../../../utils/numberFormat';
import { ImageUploadField } from '../../common/ImageUploadField';
import { DatePickerField } from '../../common/DatePickerField';
import { formatDateForDisplay, getTodayDateInputValue } from '../../../utils/date';

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
  const [surfaceOptions, setSurfaceOptions] = useState<SurfaceType[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<string[]>([]);
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
  const quotePitch = selectedPitch ?? detailPitch;

  // Booking Flow State
  const [bookingDate, setBookingDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<SelectedPitchSlot[]>([]);
  const [bookingQuote, setBookingQuote] = useState<BookingQuote | null>(null);
  const [isQuotingBooking, setIsQuotingBooking] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Create Pitch Modal State
  const [formName, setFormName] = useState('');
  const [formComplexName, setFormComplexName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formSurface, setFormSurface] = useState<SurfaceType>('');
  const [formDimensions, setFormDimensions] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState('');
  const [formAmenities, setFormAmenities] = useState<string[]>([]);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    pitchesService.getOptions()
      .then((options) => {
        setSurfaceOptions(options.surfaces);
        setAmenityOptions(options.amenities);
      })
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Impossible de charger les options des terrains.', 'error'));
  }, [showToast]);

  useEffect(() => {
    async function loadPitches() {
      const requestId = ++pitchRequestId.current;
      // Keep the current pitch mounted while refreshing date-specific availability.
      setIsLoading(!hasLoadedPitches.current);
      try {
        const data = await pitchesService.list({
          surface: surfaceFilter,
          city: cityFilter,
          date: routePitchId && bookingDate ? bookingDate : undefined,
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
    if (!isBookingRoute) setSelectedSlots([]);
  }, [routePitchId, isBookingRoute]);

  useEffect(() => {
    let active = true;
    if (!quotePitch || selectedSlots.length === 0) {
      setBookingQuote(null);
      setIsQuotingBooking(false);
      return;
    }
    setIsQuotingBooking(true);
    bookingsService.quote({
      pitchId: quotePitch.id,
      selections: selectedSlots.map(({ date, slot }) => ({ date, time: slot.time })),
    }).then((quote) => {
      if (active) setBookingQuote(quote);
    }).catch((error: unknown) => {
      if (active) {
        setBookingQuote(null);
        showToast(error instanceof Error ? error.message : 'Impossible de calculer le devis.', 'error');
      }
    }).finally(() => {
      if (active) setIsQuotingBooking(false);
    });
    return () => { active = false; };
  }, [quotePitch?.id, selectedSlots, showToast]);

  useEffect(() => {
    setReviewRating(detailPitch?.myRating ?? 0);
    setReviewComment(detailPitch?.myReview?.comment ?? '');
  }, [detailPitch?.id, detailPitch?.myRating, detailPitch?.myReview?.comment]);

  const toggleSlot = (slot: PitchSlot) => {
    if (!bookingDate || !slot.isAvailable) return;
    setSelectedSlots((current) => current.some((selected) => selected.date === bookingDate && selected.slot.id === slot.id)
      ? current.filter((selected) => selected.date !== bookingDate || selected.slot.id !== slot.id)
      : [...current, { slot, date: bookingDate }]);
  };

  const handleBookingDateChange = (date: string) => {
    if (date === bookingDate) return;
    setBookingDate(date);
  };

  const handleOpenBooking = (pitch: Pitch, slot?: PitchSlot) => {
    const initialSlot = slot?.isAvailable ? slot : undefined;
    const preserveDate = Boolean(initialSlot && bookingDate);
    if (!preserveDate) setBookingDate('');
    setSelectedSlots(preserveDate && initialSlot ? [{ slot: initialSlot, date: bookingDate }] : []);
    setTeamName('');
    navigate(`/pitches/${encodeURIComponent(pitch.id)}/book`);
  };

  const resetCreatePitchForm = () => {
    setFormName('');
    setFormComplexName('');
    setFormCity('');
    setFormAddress('');
    setFormSurface('');
    setFormDimensions('');
    setFormHourlyRate('');
    setFormAmenities([]);
    setFormImageUrl('');
  };

  const handleOpenCreatePitch = () => {
    resetCreatePitchForm();
    pitchModal.openCreate();
  };

  const handleConfirmBooking = async () => {
    if (!selectedPitch || !selectedSlots.length) return;
    setIsSubmitting(true);
    try {
      const created = await bookingsService.requestBookings({
        pitchId: selectedPitch.id,
        selections: selectedSlots.map(({ date, slot }) => ({ date, time: slot.time })),
        teamName: teamName.trim() || undefined,
      });
      showToast(`${created.length} créneau(x) confirmé(s) sur ${selectedPitch.name}.`, 'success');
      navigate(`/pitches/${encodeURIComponent(selectedPitch.id)}`, { replace: true });
      setSelectedSlots([]);
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la réservation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatePitch = async () => {
    if (!detailPitch || !reviewRating) return;
    setIsSubmittingReview(true);
    try {
      const updatedPitch = await pitchesService.rate(detailPitch.id, { rating: reviewRating, comment: reviewComment });
      setPitches((current) => current.map((pitch) => pitch.id === updatedPitch.id ? updatedPitch : pitch));
      showToast('Votre évaluation du terrain a été enregistrée.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible d’enregistrer votre évaluation.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const toggleAmenity = (item: string) => {
    setFormAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleCreatePitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComplexName.trim() || !formCity.trim() || !formAddress.trim() || !formSurface || !formDimensions.trim() || !formImageUrl) {
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
      const input: CreatePitchInput = {
        name: formName.trim(),
        complexName: formComplexName.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
        surface: formSurface,
        dimensions: formDimensions.trim(),
        imageUrl: formImageUrl,
        hourlyRate: rate,
        amenities: formAmenities,
      };

      const created = await pitchesService.create(input);
      showToast(`Terrain "${created.name}" ajouté avec succès !`, 'success');
      // Reset form fields
      resetCreatePitchForm();

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

  const surfaces: (SurfaceType | 'Toutes')[] = ['Toutes', ...surfaceOptions];

  const selectedSlotsByDate = selectedSlots.reduce<Record<string, PitchSlot[]>>((groups, selection) => {
    (groups[selection.date] ??= []).push(selection.slot);
    return groups;
  }, {});
  const selectedSlotsForCurrentDate = selectedSlots.filter((selection) => selection.date === bookingDate);
  const selectedSlotsTotal = bookingQuote?.total ?? 0;
  const currentDateTotal = bookingQuote?.perDate[bookingDate] ?? 0;

  if (routePitchId && !isBookingRoute && pitchModal.mode !== 'create') {
    if (isLoading) return <CardSkeleton />;
    if (!detailPitch) {
      return <EmptyState icon={MapPin} title="Terrain introuvable" description="Ce terrain n’existe pas ou n’est plus disponible." />;
    }

    return (
      <div className="space-y-6 pb-16">
        <button type="button" onClick={() => navigate('/pitches')} className="text-sm font-bold text-pitch-primary hover:underline">← Retour aux terrains</button>
        <section className="overflow-hidden rounded-3xl border border-pitch-line bg-white shadow-xs">
          <div className="relative h-64 sm:h-80 lg:h-105">
            <img src={detailPitch.imageUrl} alt={detailPitch.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <p className="text-sm font-bold text-lime-300">{detailPitch.complexName}</p>
              <h1 className="mt-1 text-2xl font-extrabold md:text-4xl">{detailPitch.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/90"><MapPin className="h-4 w-4" />{detailPitch.address}, {detailPitch.city}</p>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-7">
            <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">Surface</span><strong className="mt-1 block text-sm text-pitch-ink">{detailPitch.surface}</strong></div>
            <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">Dimensions</span><strong className="mt-1 block text-sm text-pitch-ink">{detailPitch.dimensions}</strong></div>
            <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">Évaluation</span><strong className="mt-1 flex items-center gap-1 text-sm text-pitch-ink">{detailPitch.reviewsCount > 0 && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}{detailPitch.reviewsCount > 0 ? `${formatFiniteNumber(detailPitch.rating, 1)} (${formatFiniteNumber(detailPitch.reviewsCount)} avis)` : 'Pas encore noté'}</strong></div>
            <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">Tarif indicatif</span><strong className="mt-1 block text-sm text-pitch-primary">À partir de {formatFiniteNumber(detailPitch.hourlyRate)} € / séance</strong></div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
            <h2 className="text-lg font-extrabold text-pitch-ink">Équipements et services</h2>
            {detailPitch.amenities.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {detailPitch.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 shrink-0 text-pitch-primary" />{amenity}</li>)}
            </ul> : <p className="mt-3 text-sm text-slate-500">Aucun équipement renseigné.</p>}
          </div>
          <div className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-extrabold text-pitch-ink">Créneaux disponibles</h2><p className="mt-1 text-xs text-slate-500">Sélectionnez un ou plusieurs créneaux à réserver.</p></div>
              <Calendar className="h-5 w-5 text-pitch-primary" />
            </div>
            <div className="mt-4 max-w-sm">
              <DatePickerField id="pitch-detail-date" label="Choisir une date" value={bookingDate} onChange={handleBookingDateChange} min={getTodayDateInputValue()} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {bookingDate ? detailPitch.availableSlots.map((slot) => {
                const isSelected = selectedSlots.some((selected) => selected.date === bookingDate && selected.slot.id === slot.id);
                return <div key={slot.id} className="flex items-center justify-between gap-3 rounded-2xl border border-pitch-line bg-pitch-panel p-3">
                  <div><strong className="block text-sm text-pitch-ink">{slot.time}</strong><span className="mt-1 block text-xs text-slate-500">{slot.price} € · 1h30</span></div>
                  <button type="button" disabled={!slot.isAvailable} aria-pressed={isSelected} onClick={() => toggleSlot(slot)} className={`rounded-xl px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:bg-slate-300 ${isSelected ? 'bg-pitch-action text-white' : 'border border-pitch-line bg-white text-pitch-primary hover:bg-pitch-panel-hover'}`}>{!slot.isAvailable ? 'Indisponible' : isSelected ? 'Sélectionné' : 'Sélectionner'}</button>
                </div>;
              }) : <p className="text-sm text-slate-500">Choisissez une date pour afficher les créneaux disponibles.</p>}
              {bookingDate && !detailPitch.availableSlots.some((slot) => slot.isAvailable) && <p className="text-sm text-slate-500">Aucun créneau disponible pour cette date.</p>}
            </div>
            {selectedSlots.length > 0 && <div className="mt-5 rounded-2xl border border-pitch-line bg-pitch-panel p-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-600"><strong className="text-pitch-ink">Rappel : {selectedSlots.length} créneau(x)</strong> · <strong className="text-pitch-primary">{isQuotingBooking ? 'Calcul du devis…' : bookingQuote ? `${selectedSlotsTotal} € au total` : 'Devis indisponible'}</strong></p>
                <button type="button" onClick={() => { setTeamName(''); navigate(`/pitches/${encodeURIComponent(detailPitch.id)}/book`); }} className="rounded-xl bg-pitch-action px-4 py-3 text-sm font-bold text-white hover:bg-pitch-action-hover">Réserver les créneaux sélectionnés</button>
              </div>
              <ul className="mt-3 space-y-2 border-t border-pitch-line pt-3">
                {Object.entries(selectedSlotsByDate).map(([date, slots]) => <li key={date} className="flex flex-wrap justify-between gap-2 text-xs text-slate-600"><span className="font-bold text-pitch-ink">{date}</span><span>{slots.map((slot) => slot.time).join(' · ')}{bookingQuote && ` · ${formatFiniteNumber(bookingQuote.perDate[date])} €`}</span></li>)}
              </ul>
            </div>}
          </div>
        </section>

        <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-extrabold text-pitch-ink">Évaluer ce terrain</h2><p className="mt-1 text-sm text-slate-500">Votre note contribue à la note affichée aux autres joueurs.</p></div>
            <p className="flex items-center gap-1 text-sm font-bold text-pitch-ink"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{detailPitch.reviewsCount ? `${formatFiniteNumber(detailPitch.rating, 1)} / 5 · ${formatFiniteNumber(detailPitch.reviewsCount)} avis` : 'Aucun avis pour le moment'}</p>
          </div>
          <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Votre note sur cinq">
            {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={reviewRating === value} aria-label={`${value} sur 5`} onClick={() => setReviewRating(value)} className="rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-pitch-primary"><Star className={`h-7 w-7 ${reviewRating >= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}
          </div>
          <label className="mt-3 block text-xs font-bold text-slate-700" htmlFor="pitch-review-comment">Commentaire (facultatif)</label>
          <textarea id="pitch-review-comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value.slice(0, 500))} maxLength={500} rows={3} placeholder="Décrivez votre expérience sur ce terrain…" className="mt-1 w-full resize-y rounded-xl border border-pitch-line bg-pitch-panel p-3 text-sm text-pitch-ink focus:border-pitch-primary focus:outline-hidden" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">{reviewComment.length}/500 caractères · une note par compte, modifiable à tout moment</span><button type="button" disabled={!reviewRating || isSubmittingReview} onClick={handleRatePitch} className="rounded-xl bg-pitch-action px-4 py-3 text-sm font-bold text-white hover:bg-pitch-action-hover disabled:cursor-not-allowed disabled:opacity-50">{isSubmittingReview ? 'Enregistrement…' : detailPitch.myRating ? 'Mettre à jour mon avis' : 'Publier mon avis'}</button></div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            Terrains & Complexes
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Réservez vos créneaux en direct ou déclarez votre infrastructure sportive sur Footera.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={handleOpenCreatePitch}
            className="px-4 py-2 min-h-11 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un terrain</span>
          </button>
          <button
            onClick={() => navigate('/profile/bookings')}
            className="px-4 py-2 min-h-11 rounded-2xl bg-white hover:bg-slate-50 text-pitch-ink text-xs font-bold border border-pitch-line shadow-2xs cursor-pointer"
          >
            Mes réservations
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-3xl bg-white border border-pitch-line grid grid-cols-1 md:grid-cols-2 gap-3 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Type de surface</label>
          <select
            value={surfaceFilter}
            onChange={(e) => setSurfaceFilter(e.target.value as any)}
            className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary outline-hidden"
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
            className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary outline-hidden"
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
              className="rounded-3xl bg-white border border-pitch-line hover:border-pitch-primary/50 overflow-hidden transition-all cursor-pointer group shadow-xs flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-pitch-primary"
            >
              <div>
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={pitch.imageUrl}
                    alt={pitch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-pitch-ink/85 backdrop-blur-xs text-lime-volt px-2.5 py-1 rounded-full text-xs font-extrabold shadow-xs">
                    {pitch.reviewsCount > 0 ? <><Star className="w-3.5 h-3.5 fill-lime-volt" /><span>{formatFiniteNumber(pitch.rating, 1)}</span><span className="text-white/60 font-medium">({formatFiniteNumber(pitch.reviewsCount)})</span></> : <span>Pas encore noté</span>}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-xs font-bold text-lime-volt block mb-0.5">
                      {pitch.surface} · {pitch.dimensions}
                    </span>
                    <h3 className="text-lg font-extrabold text-white truncate">
                      {pitch.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center text-xs text-slate-600 gap-1.5">
                    <MapPin className="w-4 h-4 text-pitch-primary shrink-0" />
                    <span className="truncate">{pitch.address}, {pitch.city}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pitch.amenities.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 bg-pitch-panel border border-border-subtle text-pitch-ink rounded-lg text-caption font-medium"
                      >
                        {a}
                      </span>
                    ))}
                    {pitch.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-caption font-bold">
                        +{pitch.amenities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-pitch-panel border-t border-pitch-separator flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-caption block font-medium">À partir de</span>
                  <span className="text-lg font-extrabold text-pitch-primary tabular-nums">
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
                  className="px-4 py-2 bg-pitch-action group-hover:bg-pitch-action-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
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
              <DatePickerField id="pitch-booking-date" label="Date de réservation" value={bookingDate} onChange={handleBookingDateChange} min={getTodayDateInputValue()} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Créneaux disponibles (1h30)
              </label>
              {bookingDate ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          ? 'bg-pitch-primary border-pitch-primary text-white shadow-xs'
                          : 'bg-white border-pitch-line text-pitch-ink hover:border-pitch-primary'
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
              </div> : <p className="text-sm text-slate-500">Choisissez une date pour consulter les créneaux.</p>}
            </div>

            {selectedSlotsForCurrentDate.length > 0 && (
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">{selectedSlotsForCurrentDate.length} créneau(x) · total</span>
                  <span className="text-xl font-extrabold text-pitch-primary tabular-nums">
                    {isQuotingBooking ? 'Calcul…' : `${currentDateTotal} € TTC`}
                  </span>
                </div>
                <div className="text-right text-slate-500">
                  <span>{formatDateForDisplay(bookingDate)}</span>
                  <span className="block font-bold text-pitch-ink">{selectedSlotsForCurrentDate.map((selection) => selection.slot.time).join(' · ')}</span>
                </div>
              </div>
            )}

            {selectedSlots.length > 0 && <aside className="rounded-2xl border border-pitch-line bg-white p-4" aria-label="Récapitulatif des créneaux sélectionnés">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold text-pitch-ink">Rappel de votre sélection</p>
                <p className="text-xs font-bold text-pitch-primary">{selectedSlots.length} créneau(x) · {isQuotingBooking ? 'Calcul du devis…' : `${selectedSlotsTotal} €`}</p>
              </div>
              <ul className="mt-2 space-y-1.5">
                {Object.entries(selectedSlotsByDate).map(([date, slots]) => <li key={date} className="flex flex-wrap justify-between gap-x-3 text-xs text-slate-600">
                  <span className="font-semibold">{formatDateForDisplay(date)}</span><span>{slots.map((slot) => slot.time).join(' · ')}</span>
                </li>)}
              </ul>
            </aside>}

            <div className="pt-2">
              <button
                onClick={handleConfirmBooking}
                disabled={!selectedSlots.length || !bookingQuote || isSubmitting || isQuotingBooking}
                className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
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
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
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
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
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
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
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
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type de surface *</label>
                <select
                  value={formSurface}
                  onChange={(e) => setFormSurface(e.target.value as SurfaceType)}
                  required
                  disabled={surfaceOptions.length === 0}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="" disabled>Choisir un type de surface</option>
                  {surfaceOptions.map((surface) => <option key={surface} value={surface}>{surface}</option>)}
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
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
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
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Équipements et commodités du complexe
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {amenityOptions.map((item) => {
                  const isChecked = formAmenities.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleAmenity(item)}
                      className={`p-2.5 rounded-xl border text-left text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'border-pitch-primary bg-pitch-selected text-pitch-primary font-bold'
                          : 'border-pitch-line bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-pitch-primary shrink-0" />
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
                Photo principale du terrain *
              </label>
              <ImageUploadField purpose="pitch" label="Importer une photo du terrain" onUploaded={setFormImageUrl} disabled={isCreating || !user?.roles?.includes('Gestionnaire Terrain')} disabledHint="Le rôle Gestionnaire Terrain doit être attribué à votre compte pour importer l’image." />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PITCH_IMAGE_PRESETS.map((preset) => {
                  const isSelected = formImageUrl === preset.url;
                  return (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() => setFormImageUrl(preset.url)}
                      className={`relative h-20 rounded-2xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                        isSelected ? 'border-pitch-primary ring-2 ring-lime-volt' : 'border-transparent hover:opacity-90'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                        <span className="text-caption font-bold text-white leading-tight">
                          {preset.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-lime-volt text-pitch-ink flex items-center justify-center font-bold text-micro">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-pitch-separator">
              <button
                type="button"
                onClick={pitchModal.close}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
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
