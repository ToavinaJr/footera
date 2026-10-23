import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { APP_SECTIONS, BOOKING_STATUSES, NOTIFICATION_TYPES } from '../../types/domain.js';
import { normalizeDateKey } from '../../utils/date.utils.js';
import { isFiniteNumberInRange, isIntegerInRange } from '../../utils/number.utils.js';
import { sanitizeMultilineText, sanitizePlainText } from '../../utils/sanitize.utils.js';
import type { BookingRecord, PitchRecord, PitchReviewRecord } from '../../types/records.js';

export interface BookingSelection { date: string; time: string }
export interface BookingBatchInput { pitchId: string; selections: BookingSelection[]; teamName?: string }
export interface CreateBookingInput { pitchId: string; date: string; time: string; teamName?: string }
export interface CreatePitchInput {
  name: string;
  complexName: string;
  city: string;
  address: string;
  surface: string;
  dimensions: string;
  imageUrl: string;
  hourlyRate: number;
  amenities: string[];
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService, private readonly notifications: NotificationsService, private readonly catalogs: CatalogsService) {}
  async getPitchOptions() {
    const options = await this.catalogs.options();
    return { surfaces: options.pitchSurfaces, amenities: options.pitchAmenities };
  }

  async listPitches(filters: { city?: string; surface?: string; date?: string } = {}) {
    const [pitches, user] = await Promise.all([
      this.records.list<PitchRecord>('pitches'),
      this.accounts.profile(),
    ]);
    const bookings = filters.date ? await this.records.list<BookingRecord>('bookings') : [];
    return pitches
      .filter((pitch) => (!filters.city || filters.city === 'Toutes' || pitch.city?.toLowerCase().includes(filters.city.toLowerCase()))
        && (!filters.surface || filters.surface === 'Toutes' || pitch.surface === filters.surface))
      .map((pitch) => this.withDateAvailability(this.withReviewStats(pitch, user?.id), bookings, filters.date));
  }
  async getPitch(id: string, date?: string) {
    const pitch = await this.records.find<PitchRecord>('pitches', id);
    if (!pitch) return pitch;
    const user = await this.accounts.profile();
    const pitchWithReview = this.withReviewStats(pitch, user?.id);
    if (!date) return pitchWithReview;
    const bookings = await this.records.list<BookingRecord>('bookings');
    return this.withDateAvailability(pitchWithReview, bookings, date);
  }

  private withReviewStats(pitch: PitchRecord, userId?: string): PitchRecord {
    const reviews = Array.isArray(pitch.reviews)
      ? pitch.reviews.filter((review) => Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5)
      : [];
    const latestByUser = new Map<string, PitchReviewRecord>();
    for (const review of reviews) {
      const previous = latestByUser.get(review.userId);
      if (!previous || String(review.createdAt || '') >= String(previous.createdAt || '')) latestByUser.set(review.userId, review);
    }
    const uniqueReviews = [...latestByUser.values()];
    const total = uniqueReviews.reduce((sum, review) => sum + review.rating, 0);
    const myReview = uniqueReviews.find((review) => review.userId === userId);
    return {
      ...pitch,
      reviews: uniqueReviews,
      rating: uniqueReviews.length ? Number((total / uniqueReviews.length).toFixed(2)) : 0,
      reviewsCount: uniqueReviews.length,
      myRating: myReview?.rating,
      myReview,
    };
  }
  private withDateAvailability(pitch: PitchRecord, bookings: BookingRecord[], date?: string): PitchRecord {
    if (!date) return pitch;
    const bookedTimes = new Set(bookings
      .filter((booking) => booking.pitchId === pitch.id && normalizeDateKey(booking.date) === normalizeDateKey(date) && booking.status !== BOOKING_STATUSES.CANCELLED)
      .map((booking) => booking.time));
    return {
      ...pitch,
      availableSlots: (pitch.availableSlots || []).map((slot) => ({
        ...slot,
        isAvailable: Boolean(slot.isAvailable) && !bookedTimes.has(slot.time),
      })),
    };
  }
  async quoteBookings(input: { pitchId: string; selections: Array<{ date: string; time: string }> }) {
    if (!input?.pitchId || !Array.isArray(input.selections) || input.selections.length === 0 || input.selections.length > 30) {
      throw new BadRequestException('Sélection de créneaux invalide.');
    }
    const pitch = await this.records.find<PitchRecord>('pitches', input.pitchId);
    if (!pitch) throw new ConflictException('Ce terrain n’est plus disponible.');
    const bookings = await this.records.list<BookingRecord>('bookings');
    const perDate: Record<string, number> = {};
    const seen = new Set<string>();
    for (const selection of input.selections) {
      if (typeof selection?.date !== 'string' || !selection.date.trim() || selection.date.length > 80
        || typeof selection?.time !== 'string' || !selection.time.trim() || selection.time.length > 40) {
        throw new BadRequestException('Date ou horaire de créneau invalide.');
      }
      const key = `${selection.date}:${selection.time}`;
      if (seen.has(key)) throw new ConflictException('Un créneau est sélectionné plusieurs fois.');
      seen.add(key);
      const slot = pitch.availableSlots?.find((candidate) => candidate.time === selection.time && candidate.isAvailable);
      const alreadyBooked = bookings.some((booking) => booking.pitchId === input.pitchId
        && normalizeDateKey(booking.date) === normalizeDateKey(selection.date) && booking.time === selection.time && booking.status !== BOOKING_STATUSES.CANCELLED);
      if (!slot || alreadyBooked) throw new ConflictException(`Le créneau ${selection.time} du ${selection.date} n’est plus disponible.`);
      const price = Number(slot.price);
      if (!Number.isFinite(price) || price < 0) throw new ConflictException('Le tarif de ce créneau est invalide.');
      perDate[selection.date] = Number(perDate[selection.date] || 0) + price;
    }
    return { total: Object.values(perDate).reduce((total, price) => total + price, 0), perDate };
  }

  async createBookings(input: BookingBatchInput) {
    // Recompute and revalidate on the server; never trust the displayed quote or client-submitted prices.
    await this.quoteBookings(input);
    const [pitch, user, currentBookings] = await Promise.all([
      this.records.find<PitchRecord>('pitches', input.pitchId),
      this.accounts.profile(),
      this.records.list<BookingRecord>('bookings'),
    ]);
    if (!pitch) throw new ConflictException('Ce terrain n’est plus disponible.');
    if (!user?.id) throw new ForbiddenException('Connectez-vous pour réserver ce terrain.');

    const selections = input.selections;
    for (const selection of selections) {
      const reserved = currentBookings.some((booking) => booking.pitchId === input.pitchId
        && normalizeDateKey(booking.date) === normalizeDateKey(selection.date) && booking.time === selection.time && booking.status !== BOOKING_STATUSES.CANCELLED);
      if (reserved) throw new ConflictException(`Le créneau ${selection.time} du ${selection.date} vient d’être réservé.`);
    }

    const bookings = selections.map((selection) => {
      const slot = pitch.availableSlots.find((candidate) => candidate.time === selection.time && candidate.isAvailable);
      if (!slot) throw new ConflictException(`Le créneau ${selection.time} n’est plus disponible.`);
      const id = `bkg_${randomUUID()}`;
      return {
        id, userId: user.id, pitchId: input.pitchId, pitchName: pitch.name || 'Terrain réservé',
        complexName: pitch.complexName || 'Complexe Footera', surface: pitch.surface || 'Synthétique',
        date: selection.date, time: selection.time, durationMinutes: 90, totalPrice: Number(slot.price),
        bookerName: user?.name || 'Joueur Footera', bookerPhone: user?.phone || '',
        teamName: sanitizePlainText(input.teamName, 100) || user?.sportsCv?.currentTeam || 'Footera FC',
        status: BOOKING_STATUSES.CONFIRMED, createdAt: new Date().toISOString(),
      };
    });

    for (const booking of bookings) await this.records.create('bookings', booking.id, booking);
    for (const booking of bookings) {
      await this.notifications.add({
        title: 'Réservation confirmée',
        message: `Créneau validé le ${booking.date} à ${booking.time} (${booking.pitchName}).`,
        type: NOTIFICATION_TYPES.BOOKING, targetSection: APP_SECTIONS.BOOKINGS, targetId: booking.id,
      });
    }
    return bookings;
  }

  async ratePitch(pitchId: string, input: { rating: number; comment?: string }) {
    const rating = Number(input?.rating);
    const comment = sanitizeMultilineText(input?.comment, 500);
    if (!isIntegerInRange(rating, 1, 5) || (typeof input?.comment === 'string' && input.comment.length > 500)) {
      throw new BadRequestException('La note doit être comprise entre 1 et 5 et le commentaire ne doit pas dépasser 500 caractères.');
    }
    const [pitch, user] = await Promise.all([
      this.records.find<PitchRecord>('pitches', pitchId),
      this.accounts.profile(),
    ]);
    if (!pitch) throw new ConflictException('Ce terrain n’est plus disponible.');
    if (!user?.id) throw new ForbiddenException('Connectez-vous pour noter ce terrain.');

    const reviews = pitch.reviews ?? [];
    const existingIndex = reviews.findIndex((review) => review.userId === user.id);
    const previous = existingIndex >= 0 ? reviews[existingIndex] : undefined;
    const review = {
      userId: user.id,
      reviewerName: user.name || 'Joueur Footera',
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    const updatedReviews = [...reviews];
    if (existingIndex >= 0) updatedReviews[existingIndex] = review;
    else updatedReviews.push(review);

    const updatedPitch = this.withReviewStats({ ...pitch, reviews: updatedReviews }, user.id);
    if (previous?.rating === rating && previous?.comment === comment) return updatedPitch;
    return this.records.save('pitches', pitchId, updatedPitch);
  }
  async createPitch(input: CreatePitchInput) {
    const user = await this.accounts.profile();
    if (!user?.roles?.includes('Gestionnaire Terrain')) {
      throw new ForbiddenException('Votre compte doit disposer du rôle Gestionnaire Terrain pour publier un terrain.');
    }
    const [surfaces, amenities] = await Promise.all([
      this.catalogs.values('pitchSurfaces'),
      this.catalogs.values('pitchAmenities'),
    ]);
    if (!surfaces.includes(input?.surface)) throw new BadRequestException('Type de surface invalide.');
    if (!Array.isArray(input?.amenities) || input.amenities.some((amenity: unknown) => !amenities.includes(amenity as string))) {
      throw new BadRequestException('La liste des équipements et commodités est invalide.');
    }
    input.imageUrl = validateImageUrl(input.imageUrl, 'Photo du terrain');
    const id = `pitch_${randomUUID()}`;
    const rate = Number(input.hourlyRate);
    if (!isFiniteNumberInRange(rate, 5, 1_000_000)) {
      throw new BadRequestException('Le tarif par créneau doit être compris entre 5 et 1 000 000.');
    }
    const availableSlots = [
      { id: `${id}_slot_1`, time: '09:00 - 10:30', price: rate, isAvailable: true },
      { id: `${id}_slot_2`, time: '14:00 - 15:30', price: rate, isAvailable: true },
      { id: `${id}_slot_3`, time: '18:00 - 19:30', price: Math.round(rate * 1.1), isAvailable: true },
      { id: `${id}_slot_4`, time: '20:00 - 21:30', price: Math.round(rate * 1.15), isAvailable: true },
    ];
    const pitch = { ...input, id, rating: 0, reviewsCount: 0, reviews: [], amenities: input.amenities || [], availableSlots };
    await this.records.create('pitches', id, pitch);
    await this.notifications.add({ title: 'Nouveau terrain disponible', message: `Le terrain "${pitch.name}" est désormais réservable sur Footera.`, type: NOTIFICATION_TYPES.BOOKING, targetSection: APP_SECTIONS.PITCHES, targetId: id });
    return pitch;
  }
  async listBookings() {
    const user = await this.accounts.profile();
    return (await this.records.list<BookingRecord>('bookings'))
      .filter((booking) => booking.userId === user?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createBooking(input: CreateBookingInput) {
    const [booking] = await this.createBookings({
      pitchId: input.pitchId,
      selections: [{ date: input.date, time: input.time }],
      teamName: input.teamName,
    });
    return booking;
  }
  async cancelBooking(id: string) {
    const booking = await this.records.find<BookingRecord>('bookings', id);
    const user = await this.accounts.profile();
    if (!booking || booking.userId !== user?.id) return false;
    if (booking.status === BOOKING_STATUSES.CANCELLED) return true;
    await this.records.save('bookings', id, { ...booking, status: BOOKING_STATUSES.CANCELLED });
    try {
      await this.notifications.add({
        title: 'Réservation annulée',
        message: `La réservation pour ${booking.pitchName} du ${booking.date} à ${booking.time} a été annulée.`,
        type: NOTIFICATION_TYPES.BOOKING,
        targetSection: APP_SECTIONS.BOOKINGS,
        targetId: id,
      });
    } catch (error) {
      this.logger.warn(`Booking ${id} was cancelled, but its notification could not be created: ${String(error)}`);
    }
    return true;
  }
}
