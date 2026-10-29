import React,{ useEffect,useState } from 'react';
import { useLocation,useNavigate,useParams } from 'react-router-dom';
import { useApp } from '../../../context/useApp';
import { useResource } from '../../../hooks/useResource';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { useUrlState } from '../../../hooks/useUrlState';
import { useTranslation } from '../../../i18n';
import { BookingQuote,bookingsService } from '../../../services/bookingsService';
import { CreatePitchInput,pitchesService } from '../../../services/pitchesService';
import { Pitch,PitchSlot,SurfaceType } from '../../../types';
import { useListPagination } from '../../common/ListPage';

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

/** Data, URL state and mutations shared by the list and its routed dialogs. */
export function usePitchesViewModel() {
  const { t } = useTranslation();
  const { showToast, selectedResourceId } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { pitchId: routePitchId } = useParams();
  const isBookingRoute = location.pathname.endsWith('/book');
  const pitchModal = useRouteModal('/pitches');
  const [surfaceOptions, setSurfaceOptions] = useState<SurfaceType[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<string[]>([]);
  const [surfaceFilter, setSurfaceFilter] = useUrlState<string>('surface', 'Toutes');
  const [cityFilter, setCityFilter] = useUrlState<string>('city', 'Toutes');
  const [bookingDate, setBookingDate] = useUrlState<string>('date', '');
  const [query, setQuery] = useUrlState<string>('query', '');
  const [mine, setMine] = useUrlState<boolean>('mine', false);
  const list = useResource<Pitch[]>(JSON.stringify([surfaceFilter, cityFilter, bookingDate]), () => pitchesService.list({ surface: surfaceFilter, city: cityFilter, date: bookingDate || undefined }), []);
  const pitches = list.data;
  const setPitches = list.setData;
  const isLoading = list.loading && !pitches.length;
  const detail = useResource<Pitch | null>(JSON.stringify([routePitchId, bookingDate]), () => pitchesService.getById(routePitchId!, bookingDate || undefined), null, !!routePitchId && routePitchId !== 'new');
  const routePitch = detail.data?.id === routePitchId ? detail.data : null;
  const page = useListPagination(pitches.filter((pitch) => (!mine || pitch.canManageGallery) && (!query || (pitch.name + ' ' + pitch.city + ' ' + pitch.complexName).toLocaleLowerCase().includes(query.toLocaleLowerCase()))));

  // Selected Pitch for booking
  const selectedPitch = isBookingRoute && routePitchId
    ? routePitch
    : null;
  const detailPitch = routePitchId && !isBookingRoute && pitchModal.mode !== 'create'
    ? routePitch
    : null;
  const quotePitch = selectedPitch ?? detailPitch;

  // Booking Flow State
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
    // Keep the selected date when navigating between the list and booking.
    setSelectedSlots(preserveDate && initialSlot ? [{ slot: initialSlot, date: bookingDate }] : []);
    setTeamName('');
    navigate(`/pitches/${encodeURIComponent(pitch.id)}/book${location.search}`);
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
      list.refresh();
      detail.refresh();
      navigate(`/pitches/${encodeURIComponent(selectedPitch.id)}${location.search}`, { replace: true });
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
      detail.setData(updatedPitch);
      detail.refresh();
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
  return { t, navigate, routePitchId, isBookingRoute, pitchModal, surfaceFilter, setSurfaceFilter, cityFilter, setCityFilter, bookingDate, setBookingDate, query, setQuery, mine, setMine, list, isLoading, detail, page, selectedPitch, detailPitch, selectedSlots, bookingQuote, isQuotingBooking, reviewRating, setReviewRating, reviewComment, setReviewComment, isSubmittingReview, toggleSlot, handleBookingDateChange, handleOpenBooking, handleOpenCreatePitch, handleRatePitch, surfaces, selectedSlotsByDate, selectedSlotsTotal, surfaceOptions, amenityOptions, setSelectedSlots, isSubmitting, formName, setFormName, formComplexName, setFormComplexName, formCity, setFormCity, formAddress, setFormAddress, formSurface, setFormSurface, formGameFormat, setFormGameFormat, gameFormatOptions, formDimensions, setFormDimensions, formHourlyRate, setFormHourlyRate, formAmenities, formImageUrl, setFormImageUrl, isCreating, canCreatePitch, handleConfirmBooking, toggleAmenity, handleCreatePitch, selectedSlotsForCurrentDate, currentDateTotal };
}
