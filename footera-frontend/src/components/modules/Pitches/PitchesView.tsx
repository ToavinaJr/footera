import { Calendar,Check,MapPin,Plus,Star } from 'lucide-react';
import React from 'react';
import { PitchSlot,SurfaceType } from '../../../types';
import { formatDateForDisplay,getTodayDateInputValue } from '../../../utils/date';
import { formatFiniteNumber } from '../../../utils/numberFormat';
import { DatePickerField } from '../../common/DatePickerField';
import { EmptyState } from '../../common/EmptyState';
import { ListError,ListPageLayout,Pagination } from '../../common/ListPage';
import { ListToolbar } from '../../common/ListToolbar';
import { PhotoGallery } from '../../common/PhotoGallery';
import { SelectField } from '../../common/SelectField';
import { MultiSelectField } from '../../common/MultiSelectField';
import { CardSkeleton } from '../../common/Skeleton';
import { PitchesDialogs } from './PitchesDialogs';
import { usePitchesViewModel } from './usePitchesViewModel';


interface SelectedPitchSlot {
  slot: PitchSlot;
  date: string;
}

export const PitchesView: React.FC = () => {
  const model = usePitchesViewModel();
  const { t, navigate, routePitchId, isBookingRoute, pitchModal, surfaceFilter, setSurfaceFilter, cityFilter, setCityFilter, bookingDate, setBookingDate, query, setQuery, mine, setMine, list, isLoading, detail, page, selectedPitch, detailPitch, selectedSlots, bookingQuote, isQuotingBooking, reviewRating, setReviewRating, reviewComment, setReviewComment, isSubmittingReview, toggleSlot, handleBookingDateChange, handleOpenBooking, handleOpenCreatePitch, handleRatePitch, surfaces, selectedSlotsByDate, selectedSlotsTotal } = model;

  if (routePitchId && !isBookingRoute && pitchModal.mode !== 'create') {
    if (detail.loading && !detailPitch) return <CardSkeleton />;
    if (detail.error) return <ListError error={detail.error} onRetry={detail.refresh} />;
    if (!detailPitch) {
      return <EmptyState icon={MapPin} title={t('pitch.notFoundTitle')} description={t('pitch.notFoundDescription')} />;
    }

    return (
      <div className="page-enter space-y-6 pb-16">
        <button type="button" onClick={pitchModal.close} className="text-sm font-bold text-pitch-primary hover:underline">{t('pitch.backToPitches')}</button>
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
            <h2 className="card-title text-lg font-extrabold text-pitch-ink">{t('pitch.amenitiesTitle')}</h2>
            {detailPitch.amenities.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {detailPitch.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 shrink-0 text-pitch-primary" />{amenity}</li>)}
            </ul> : <p className="mt-3 text-sm text-slate-500">{t('pitch.noAmenities')}</p>}
          </div>
          <div className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="card-title text-lg font-extrabold text-pitch-ink">{t('pitch.availableSlots')}</h2><p className="mt-1 text-xs text-slate-500">{t('pitch.selectSlots')}</p></div>
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
                <button type="button" onClick={() => handleOpenBooking(detailPitch)} className="rounded-xl bg-pitch-action px-4 py-3 text-sm font-bold text-white hover:bg-pitch-action-hover">{t('pitch.bookSelectedSlots')}</button>
              </div>
              <ul className="mt-3 space-y-2 border-t border-pitch-line pt-3">
                {Object.entries(selectedSlotsByDate).map(([date, slots]) => <li key={date} className="flex flex-wrap justify-between gap-2 text-xs text-slate-600"><span className="font-bold text-pitch-ink">{date}</span><span>{slots.map((slot) => slot.time).join(' · ')}{bookingQuote && ` · ${formatFiniteNumber(bookingQuote.perDate[date])} €`}</span></li>)}
              </ul>
            </div>}
          </div>
        </section>

        <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="card-title text-lg font-extrabold text-pitch-ink">{t('pitch.rateTitle')}</h2><p className="mt-1 text-sm text-slate-500">{t('pitch.rateDescription')}</p></div>
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
              <h2 className="card-title text-lg font-extrabold text-pitch-ink">{t('pitch.reviewsTitle')}</h2>
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
    <ListPageLayout>
      <ListError error={list.error || detail.error} onRetry={() => { list.refresh(); detail.refresh(); }} />
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
      <div className="relative z-50 p-4 rounded-3xl bg-white border border-pitch-line grid grid-cols-1 md:grid-cols-2 gap-3 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.surface')}</label>
          <MultiSelectField label={t('pitch.surface')} placeholder={t('pitch.allSurfaces')} options={surfaces} value={surfaceFilter} onChange={setSurfaceFilter} className="[&>button]:w-full [&>button]:rounded-full [&>button]:bg-pitch-input [&>button]:px-4 [&>button]:py-2.5 [&>button]:text-xs [&>button]:md:text-sm" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('pitch.location')}</label>
          <MultiSelectField label={t('pitch.location')} placeholder={t('pitch.allCities')} options={['Fianarantsoa', 'Antananarivo', 'Toamasina', 'Paris']} value={cityFilter} onChange={setCityFilter} className="[&>button]:w-full [&>button]:rounded-full [&>button]:bg-pitch-input [&>button]:px-4 [&>button]:py-2.5 [&>button]:text-xs [&>button]:md:text-sm" />
        </div>
      </div>

      <ListToolbar query={query} onQuery={setQuery} mine={mine} onMine={setMine}>
        <DatePickerField id="pitch-list-date" label={t('pitch.bookingDate')} value={bookingDate} onChange={setBookingDate} min={getTodayDateInputValue()} />
      </ListToolbar>
      {/* Pitches Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : page.total === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t('pitch.noneFoundTitle')}
          description={t('pitch.noneFoundDescription')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {page.items.map((pitch) => (
            <div
              key={pitch.id}
              onClick={() => pitchModal.openDetail(pitch.id)}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  pitchModal.openDetail(pitch.id);
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
                    <h3 className="card-title text-lg font-extrabold  truncate">
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

      <Pagination {...page} />
      {isBookingRoute && detail.loading && !selectedPitch && <CardSkeleton />}
      <PitchesDialogs model={model} />
    </ListPageLayout>
  );
};
