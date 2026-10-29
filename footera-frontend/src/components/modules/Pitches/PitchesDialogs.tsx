import { CheckSquare,Clock,Square } from 'lucide-react';
import { PitchSlot,SurfaceType } from '../../../types';
import { formatDateForDisplay,getTodayDateInputValue } from '../../../utils/date';
import { DatePickerField } from '../../common/DatePickerField';
import { ImageUploadField } from '../../common/ImageUploadField';
import { Modal } from '../../common/Modal';
import { SelectField } from '../../common/SelectField';

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

import type { usePitchesViewModel } from './usePitchesViewModel';

export function PitchesDialogs({ model }: { model: ReturnType<typeof usePitchesViewModel> }) {
  const { t, navigate, pitchModal, surfaceOptions, amenityOptions, bookingDate, selectedPitch, selectedSlots, setSelectedSlots, bookingQuote, isQuotingBooking, isSubmitting, formName, setFormName, formComplexName, setFormComplexName, formCity, setFormCity, formAddress, setFormAddress, formSurface, setFormSurface, formGameFormat, setFormGameFormat, gameFormatOptions, formDimensions, setFormDimensions, formHourlyRate, setFormHourlyRate, formAmenities, formImageUrl, setFormImageUrl, isCreating, canCreatePitch, toggleSlot, handleBookingDateChange, handleConfirmBooking, toggleAmenity, handleCreatePitch, selectedSlotsByDate, selectedSlotsForCurrentDate, selectedSlotsTotal, currentDateTotal } = model;
  return <>
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

  </>;
}
