import React, { useState, useEffect, useRef } from 'react';
import { SelectField } from '../../common/SelectField';
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
import { PhotoGallery } from '../../common/PhotoGallery';
import { useTranslation } from '../../../i18n';

const PITCH_IMAGE_PRESETS = [
  {
    name: 'synthetic',
    url: 'https://images.unsplash.com/photo-1529900240041-22f1a66a3d6d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'natural',
    url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'indoor',
    url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'night',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
  },
] as const;

interface SelectedPitchSlot {
  slot: PitchSlot;
  date: string;
}

export const PitchesView: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, selectedResourceId } = useApp();
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
  const [formGameFormat, setFormGameFormat] = useState('');
  const [gameFormatOptions, setGameFormatOptions] = useState<string[]>([]);
  const [formDimensions, setFormDimensions] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState('');
  const [formAmenities, setFormAmenities] = useState<string[]>([]);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const canCreatePitch = Boolean(formName.trim() && formComplexName.trim() && formCity.trim() && formAddress.trim()
    && formSurface && formGameFormat && formDimensions.trim() && formImageUrl
    && Number.isFinite(Number(formHourlyRate)) && Number(formHourlyRate) >= 5);

  useEffect(() => {
    pitchesService.getOptions()
      .then((options) => {
        setSurfaceOptions(options.surfaces);
        setGameFormatOptions(options.formats);
        setAmenityOptions(options.amenities);
      })
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : t('pitch.optionsError'), 'error'));
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

      } catch (err: unknown) {
        if (requestId !== pitchRequestId.current) return;
        showToast(err instanceof Error ? err.message : t('pitch.loadError'), 'error');
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
        showToast(error instanceof Error ? error.message : t('pitch.quoteError'), 'error');
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
    setFormGameFormat('');
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
      showToast(t('pitch.bookingCreated', { count: created.length, pitch: selectedPitch.name }), 'success');
      navigate(`/pitches/${encodeURIComponent(selectedPitch.id)}`, { replace: true });
      setSelectedSlots([]);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : t('pitch.bookingError'), 'error');
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
      showToast(t('pitch.reviewSaved'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('pitch.reviewSaveError'), 'error');
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
    if (!formName.trim() || !formComplexName.trim() || !formCity.trim() || !formAddress.trim() || !formSurface || !formGameFormat || !formDimensions.trim() || !formImageUrl) {
      showToast(t('pitch.requiredFields'), 'info');
      return;
    }

    const rate = parseFloat(formHourlyRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      showToast(t('pitch.invalidRate'), 'info');
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
        gameFormat: formGameFormat,
        dimensions: formDimensions.trim(),
        imageUrl: formImageUrl,
        hourlyRate: rate,
        amenities: formAmenities,
      };

      const created = await pitchesService.create(input);
      showToast(t('pitch.created', { pitch: created.name }), 'success');
      // Reset form fields
      resetCreatePitchForm();

      // Reload the list and open the newly created pitch through its URL.
      const updated = await pitchesService.list();
      setPitches(updated);
      navigate(`/pitches/${encodeURIComponent(created.id)}`, { replace: true });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('pitch.createError'), 'error');
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
      return <EmptyState icon={MapPin} title={t('pitch.notFoundTitle')} description={t('pitch.notFoundDescription')} />;
    }

    return (
      <div className="page-enter space-y-6 pb-16">
        <button type="button" onClick={() => navigate('/pitches')} className="text-sm font-bold text-pitch-primary hover:underline">{t('pitch.backToPitches')}</button>
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
            <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">{t('pitch.surface')}</span><strong className="mt-1 block text-sm text-pitch-ink">{detailPitch.surface}</strong></div>
            {detailPitch.gameFormat && <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">{t('pitch.format')}</span><strong className="mt-1 block text-sm text-pitch-ink">{detailPitch.gameFormat}</strong></div>}
            <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">{t('pitch.dimensions')}</span><strong className="mt-1 block text-sm text-pitch-ink">{detailPitch.dimensions}</strong></div>
            <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">{t('pitch.rating')}</span><strong className="mt-1 flex items-center gap-1 text-sm text-pitch-ink">{detailPitch.reviewsCount > 0 && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}{detailPitch.reviewsCount > 0 ? `${formatFiniteNumber(detailPitch.rating, 1)} (${t('pitch.reviewCount', { count: formatFiniteNumber(detailPitch.reviewsCount) })})` : t('pitch.notRated')}</strong></div>
            <div className="rounded-2xl border border-pitch-line bg-pitch-panel p-4"><span className="text-xs text-slate-500">{t('pitch.indicativeRate')}</span><strong className="mt-1 block text-sm text-pitch-primary">{t('pitch.fromPrice', { price: formatFiniteNumber(detailPitch.hourlyRate) })}</strong></div>
          </div>
        </section>
        <PhotoGallery entity="pitches" id={detailPitch.id} />

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
            <h2 className="text-lg font-extrabold text-pitch-ink">{t('pitch.amenitiesTitle')}</h2>
            {detailPitch.amenities.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {detailPitch.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 shrink-0 text-pitch-primary" />{amenity}</li>)}
            </ul> : <p className="mt-3 text-sm text-slate-500">{t('pitch.noAmenities')}</p>}
          </div>
          <div className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-extrabold text-pitch-ink">{t('pitch.availableSlots')}</h2><p className="mt-1 text-xs text-slate-500">{t('pitch.selectSlots')}</p></div>
              <Calendar className="h-5 w-5 text-pitch-primary" />
            </div>
            <div className="mt-4 max-w-sm">
              <DatePickerField id="pitch-detail-date" label={t('pitch.chooseDate')} value={bookingDate} onChange={handleBookingDateChange} min={getTodayDateInputValue()} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {bookingDate ? detailPitch.availableSlots.map((slot) => {
                const isSelected = selectedSlots.some((selected) => selected.date === bookingDate && selected.slot.id === slot.id);
                return <div key={slot.id} className="flex items-center justify-between gap-3 rounded-2xl border border-pitch-line bg-pitch-panel p-3">
                  <div><strong className="block text-sm text-pitch-ink">{slot.time}</strong><span className="mt-1 block text-xs text-slate-500">{slot.price} € · {t('pitch.slotDuration')}</span></div>
                  <button type="button" disabled={!slot.isAvailable} aria-pressed={isSelected} onClick={() => toggleSlot(slot)} className={`rounded-xl px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:bg-slate-300 ${isSelected ? 'bg-pitch-action text-white' : 'border border-pitch-line bg-white text-pitch-primary hover:bg-pitch-panel-hover'}`}>{!slot.isAvailable ? t('pitch.unavailable') : isSelected ? t('pitch.selected') : t('pitch.select')}</button>
                </div>;
              }) : <p className="text-sm text-slate-500">{t('pitch.chooseDateForSlots')}</p>}
              {bookingDate && !detailPitch.availableSlots.some((slot) => slot.isAvailable) && <p className="text-sm text-slate-500">{t('pitch.noSlotsOnDate')}</p>}
            </div>
            {selectedSlots.length > 0 && <div className="mt-5 rounded-2xl border border-pitch-line bg-pitch-panel p-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-600"><strong className="text-pitch-ink">{t('pitch.selectionReminder', { count: selectedSlots.length })}</strong> · <strong className="text-pitch-primary">{isQuotingBooking ? t('pitch.calculatingQuote') : bookingQuote ? t('pitch.totalPrice', { price: selectedSlotsTotal }) : t('pitch.quoteUnavailable')}</strong></p>
                <button type="button" onClick={() => { setTeamName(''); navigate(`/pitches/${encodeURIComponent(detailPitch.id)}/book`); }} className="rounded-xl bg-pitch-action px-4 py-3 text-sm font-bold text-white hover:bg-pitch-action-hover">{t('pitch.bookSelectedSlots')}</button>
              </div>
              <ul className="mt-3 space-y-2 border-t border-pitch-line pt-3">
                {Object.entries(selectedSlotsByDate).map(([date, slots]) => <li key={date} className="flex flex-wrap justify-between gap-2 text-xs text-slate-600"><span className="font-bold text-pitch-ink">{date}</span><span>{slots.map((slot) => slot.time).join(' · ')}{bookingQuote && ` · ${formatFiniteNumber(bookingQuote.perDate[date])} €`}</span></li>)}
              </ul>
            </div>}
          </div>
        </section>

        <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-extrabold text-pitch-ink">{t('pitch.rateTitle')}</h2><p className="mt-1 text-sm text-slate-500">{t('pitch.rateDescription')}</p></div>
            <p className="flex items-center gap-1 text-sm font-bold text-pitch-ink"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{detailPitch.reviewsCount ? `${formatFiniteNumber(detailPitch.rating, 1)} / 5 · ${t('pitch.reviewCount', { count: formatFiniteNumber(detailPitch.reviewsCount) })}` : t('pitch.reviewsEmptyShort')}</p>
          </div>
          <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label={t('pitch.yourRating')}>
            {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={reviewRating === value} aria-label={t('pitch.reviewRating', { rating: value })} onClick={() => setReviewRating(value)} className="rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-pitch-primary"><Star className={`h-7 w-7 ${reviewRating >= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}
          </div>
          <label className="mt-3 block text-xs font-bold text-slate-700" htmlFor="pitch-review-comment">{t('pitch.commentOptional')}</label>
          <textarea id="pitch-review-comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value.slice(0, 500))} maxLength={500} rows={3} placeholder={t('pitch.reviewPlaceholder')} className="mt-1 w-full resize-y rounded-xl border border-pitch-line bg-pitch-panel p-3 text-sm text-pitch-ink focus:border-pitch-primary focus:outline-hidden" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">{t('pitch.commentLength', { count: reviewComment.length })}</span><button type="button" disabled={!reviewRating || isSubmittingReview} onClick={handleRatePitch} className="rounded-xl bg-pitch-action px-4 py-3 text-sm font-bold text-white hover:bg-pitch-action-hover disabled:cursor-not-allowed disabled:opacity-50">{isSubmittingReview ? t('pitch.savingReview') : detailPitch.myRating ? t('pitch.updateReview') : t('pitch.publishReview')}</button></div>
        </section>
        <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-pitch-ink">{t('pitch.reviewsTitle')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('pitch.reviewsDescription')}</p>
            </div>
            <span className="text-sm font-semibold text-slate-600">{t('pitch.reviewCount', { count: formatFiniteNumber(detailPitch.reviewsCount) })}</span>
          </div>
          {detailPitch.reviews?.length ? <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {detailPitch.reviews.map((review) => <li key={review.userId} className="rounded-2xl border border-pitch-line bg-pitch-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-bold text-pitch-ink">{review.reviewerName}</p>
                  <time className="mt-1 block text-xs text-slate-500" dateTime={review.createdAt}>{formatDateForDisplay(review.createdAt)}</time>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-pitch-ink" aria-label={t('pitch.reviewRating', { rating: review.rating })}>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />{review.rating}/5
                </span>
              </div>
              {review.comment && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{review.comment}</p>}
            </li>)}
          </ul> : <p className="mt-4 rounded-2xl bg-pitch-panel p-4 text-sm text-slate-500">{t('pitch.reviewsEmpty')}</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6 pb-16">
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
            <span>{t('pitch.addPitch')}</span>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.surface')}</label>
          <SelectField
            value={surfaceFilter}
            onChange={(e) => setSurfaceFilter(e.target.value as SurfaceType | 'Toutes')}
            className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary outline-hidden"
          >
            {surfaces.map((s) => (
              <option key={s} value={s}>
                {s === 'Toutes' ? t('pitch.allSurfaces') : s}
              </option>
            ))}
          </SelectField>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.location')}</label>
          <SelectField
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary outline-hidden"
          >
            <option value="Toutes">{t('pitch.allCities')}</option>
            <option value="Fianarantsoa">Fianarantsoa</option>
            <option value="Antananarivo">Antananarivo</option>
            <option value="Toamasina">Toamasina</option>
            <option value="Paris">Paris</option>
          </SelectField>
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
          title={t('pitch.noneFoundTitle')}
          description={t('pitch.noneFoundDescription')}
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
              aria-label={t('pitch.viewAndBook', { pitch: pitch.name })}
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
                    {pitch.reviewsCount > 0 ? <><Star className="w-3.5 h-3.5 fill-lime-volt" /><span>{formatFiniteNumber(pitch.rating, 1)}</span><span className="text-white/60 font-medium">({formatFiniteNumber(pitch.reviewsCount)})</span></> : <span>{t('pitch.notRated')}</span>}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-xs font-bold text-lime-volt block mb-0.5">
                      {pitch.surface} · {pitch.gameFormat ? `${pitch.gameFormat} · ` : ''}{pitch.dimensions}
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
                  <span className="text-slate-400 text-caption block font-medium">{t('pitch.from')}</span>
                  <span className="text-lg font-extrabold text-pitch-primary tabular-nums">
                    {formatFiniteNumber(pitch.hourlyRate)} €
                  </span>
                  <span className="text-xs text-slate-500 font-medium"> {t('pitch.perSession')}</span>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenBooking(pitch);
                  }}
                  className="px-4 py-2 bg-pitch-action group-hover:bg-pitch-action-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {t('pitch.reserveButton')}
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
          title={t('pitch.reserveTitle', { pitch: selectedPitch.name })}
          subtitle={`${selectedPitch.complexName} · ${selectedPitch.address}, ${selectedPitch.city}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('pitch.selectBookingDate')}
              </label>
              <DatePickerField id="pitch-booking-date" label={t('pitch.bookingDate')} value={bookingDate} onChange={handleBookingDateChange} min={getTodayDateInputValue()} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('pitch.availableSlotsDuration')}
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
              </div> : <p className="text-sm text-slate-500">{t('pitch.chooseDateForSlots')}</p>}
            </div>

            {selectedSlotsForCurrentDate.length > 0 && (
              <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">{t('pitch.selectedSlotsTotal', { count: selectedSlotsForCurrentDate.length })}</span>
                  <span className="text-xl font-extrabold text-pitch-primary tabular-nums">
                    {isQuotingBooking ? t('pitch.calculatingShort') : `${currentDateTotal} € TTC`}
                  </span>
                </div>
                <div className="text-right text-slate-500">
                  <span>{formatDateForDisplay(bookingDate)}</span>
                  <span className="block font-bold text-pitch-ink">{selectedSlotsForCurrentDate.map((selection) => selection.slot.time).join(' · ')}</span>
                </div>
              </div>
            )}

            {selectedSlots.length > 0 && <aside className="rounded-2xl border border-pitch-line bg-white p-4" aria-label={t('pitch.selectedSlotsLabel')}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold text-pitch-ink">{t('pitch.selectionSummary')}</p>
                <p className="text-xs font-bold text-pitch-primary">{t('pitch.selectionReminder', { count: selectedSlots.length })} · {isQuotingBooking ? t('pitch.calculatingQuote') : `${selectedSlotsTotal} €`}</p>
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
                {isSubmitting ? t('common.loading') : t('pitch.validateSelectedSlots', { count: selectedSlots.length })}
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
          title={t('pitch.addPitchTitle')}
          subtitle={t('pitch.addPitchSubtitle')}
          maxWidth="lg"
        >
          <form onSubmit={handleCreatePitch} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('pitch.pitchNameRequired')}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('pitch.pitchNameExample')}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('pitch.complexNameRequired')}
                </label>
                <input
                  type="text"
                  required
                  value={formComplexName}
                  onChange={(e) => setFormComplexName(e.target.value)}
                  placeholder={t('pitch.complexNameExample')}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.cityRequired')}</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder={t('pitch.cityExample')}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.addressRequired')}</label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder={t('pitch.addressExample')}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.surfaceRequired')}</label>
                <SelectField
                  value={formSurface}
                  onChange={(e) => setFormSurface(e.target.value as SurfaceType)}
                  required
                  disabled={surfaceOptions.length === 0}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="" disabled>{t('pitch.chooseSurface')}</option>
                  {surfaceOptions.map((surface) => <option key={surface} value={surface}>{surface}</option>)}
                </SelectField>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.gameFormatRequired')}</label>
                <SelectField value={formGameFormat} onChange={(event) => setFormGameFormat(event.target.value)} required disabled={gameFormatOptions.length === 0} className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden">
                  <option value="" disabled>{t('pitch.chooseFormat')}</option>
                  {gameFormatOptions.map((format) => <option key={format} value={format}>{format}</option>)}
                </SelectField>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.dimensionsRequired')}</label>
                <input
                  type="text"
                  required
                  value={formDimensions}
                  onChange={(e) => setFormDimensions(e.target.value)}
                  placeholder={t('pitch.dimensionsExample')}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.hourlyRateRequired')}</label>
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
              <ImageUploadField purpose="pitch" label={t('pitch.uploadImage')} onUploaded={setFormImageUrl} disabled={isCreating} />
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
                      <img src={preset.url} alt={t(`pitch.imagePreset.${preset.name}`)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                        <span className="text-caption font-bold text-white leading-tight">
                          {t(`pitch.imagePreset.${preset.name}`)}
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
                disabled={isCreating || !canCreatePitch}
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
