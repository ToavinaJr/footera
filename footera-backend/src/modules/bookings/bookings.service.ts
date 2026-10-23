import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';

const normalizeDateKey = (value: string) => {
  const normalized = value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const match = /^(?:[a-z]+\s+)?(\d{1,2})\s+([a-z]+)\s+(\d{4})$/.exec(normalized);
  if (!match) return value.trim();
  const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
  const month = months.indexOf(match[2]);
  return month < 0 ? value.trim() : `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService, private readonly notifications: NotificationsService, private readonly catalogs: CatalogsService) {}
  async getPitchOptions() {
    const options = await this.catalogs.options();
    return { surfaces: options.pitchSurfaces, amenities: options.pitchAmenities };
  }

  async listPitches(filters: { city?: string; surface?: string; date?: string } = {}) {
    const [pitches, user]: [any[], any] = await Promise.all([
      this.records.list('pitches'),
      this.accounts.profile(),
    ]);
    const bookings = filters.date ? await this.records.list<any>('bookings') : [];
    return pitches
      .filter((pitch) => (!filters.city || filters.city === 'Toutes' || pitch.city?.toLowerCase().includes(filters.city.toLowerCase()))
        && (!filters.surface || filters.surface === 'Toutes' || pitch.surface === filters.surface))
      .map((pitch) => this.withDateAvailability(this.withReviewStats(pitch, user?.id), bookings, filters.date));
  }
  async getPitch(id: string, date?: string) {
    const pitch: any = await this.records.find('pitches', id);
    if (!pitch) return pitch;
    const user: any = await this.accounts.profile();
    const pitchWithReview = this.withReviewStats(pitch, user?.id);
    if (!date) return pitchWithReview;
    const bookings = await this.records.list<any>('bookings');
    return this.withDateAvailability(pitchWithReview, bookings, date);
  }

  private withReviewStats(pitch: any, userId?: string) {
    const reviews = Array.isArray(pitch.reviews)
      ? pitch.reviews.filter((review: any) => Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 && typeof review.userId === 'string')
      : [];
    const latestByUser = new Map<string, any>();
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
  private withDateAvailability(pitch: any, bookings: any[], date?: string) {
    if (!date) return pitch;
    const bookedTimes = new Set(bookings
      .filter((booking) => booking.pitchId === pitch.id && normalizeDateKey(booking.date) === normalizeDateKey(date) && booking.status !== 'CANCELLED')
      .map((booking) => booking.time));
    return {
      ...pitch,
      availableSlots: (pitch.availableSlots || []).map((slot: any) => ({
        ...slot,
        isAvailable: Boolean(slot.isAvailable) && !bookedTimes.has(slot.time),
      })),
    };
  }
  async quoteBookings(input: { pitchId: string; selections: Array<{ date: string; time: string }> }) {
    if (!input?.pitchId || !Array.isArray(input.selections) || input.selections.length === 0 || input.selections.length > 30) {
      throw new BadRequestException('Sélection de créneaux invalide.');
    }
    const pitch: any = await this.records.find('pitches', input.pitchId);
    if (!pitch) throw new ConflictException('Ce terrain n’est plus disponible.');
    const bookings: any[] = await this.records.list('bookings');
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
      const slot = pitch.availableSlots?.find((candidate: any) => candidate.time === selection.time && candidate.isAvailable);
      const alreadyBooked = bookings.some((booking) => booking.pitchId === input.pitchId
        && normalizeDateKey(booking.date) === normalizeDateKey(selection.date) && booking.time === selection.time && booking.status !== 'CANCELLED');
      if (!slot || alreadyBooked) throw new ConflictException(`Le créneau ${selection.time} du ${selection.date} n’est plus disponible.`);
      const price = Number(slot.price);
      if (!Number.isFinite(price) || price < 0) throw new ConflictException('Le tarif de ce créneau est invalide.');
      perDate[selection.date] = Number(perDate[selection.date] || 0) + price;
    }
    return { total: Object.values(perDate).reduce((total, price) => total + price, 0), perDate };
  }

  async createBookings(input: { pitchId: string; selections: Array<{ date: string; time: string }>; teamName?: string }) {
    // Recompute and revalidate on the server; never trust the displayed quote or client-submitted prices.
    await this.quoteBookings(input);
    const [pitch, user, currentBookings]: any[] = await Promise.all([
      this.records.find('pitches', input.pitchId),
      this.accounts.profile(),
      this.records.list('bookings'),
    ]);
    if (!pitch) throw new ConflictException('Ce terrain n’est plus disponible.');

    const selections = input.selections;
    for (const selection of selections) {
      const reserved = currentBookings.some((booking: any) => booking.pitchId === input.pitchId
        && normalizeDateKey(booking.date) === normalizeDateKey(selection.date) && booking.time === selection.time && booking.status !== 'CANCELLED');
      if (reserved) throw new ConflictException(`Le créneau ${selection.time} du ${selection.date} vient d’être réservé.`);
    }

    const bookings = selections.map((selection) => {
      const slot = pitch.availableSlots.find((candidate: any) => candidate.time === selection.time && candidate.isAvailable);
      if (!slot) throw new ConflictException(`Le créneau ${selection.time} n’est plus disponible.`);
      const id = `bkg_${randomUUID()}`;
      return {
        id, userId: user.id, pitchId: input.pitchId, pitchName: pitch.name || 'Terrain réservé',
        complexName: pitch.complexName || 'Complexe Footera', surface: pitch.surface || 'Synthétique',
        date: selection.date, time: selection.time, durationMinutes: 90, totalPrice: Number(slot.price),
        bookerName: user?.name || 'Joueur Footera', bookerPhone: user?.phone || '',
        teamName: input.teamName?.trim() || user?.sportsCv?.currentTeam || 'Footera FC',
        status: 'CONFIRMED', createdAt: new Date().toISOString(),
      };
    });

    for (const booking of bookings) await this.records.create('bookings', booking.id, booking);
    for (const booking of bookings) {
      await this.notifications.add({
        title: 'Réservation confirmée',
        message: `Créneau validé le ${booking.date} à ${booking.time} (${booking.pitchName}).`,
        type: 'booking', targetSection: 'bookings', targetId: booking.id,
      });
    }
    return bookings;
  }

  async ratePitch(pitchId: string, input: { rating: number; comment?: string }) {
    const rating = Number(input?.rating);
    const comment = typeof input?.comment === 'string' ? input.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 500) {
      throw new BadRequestException('La note doit être comprise entre 1 et 5 et le commentaire ne doit pas dépasser 500 caractères.');
    }
    const [pitch, user]: any[] = await Promise.all([
      this.records.find('pitches', pitchId),
      this.accounts.profile(),
    ]);
    if (!pitch) throw new ConflictException('Ce terrain n’est plus disponible.');
    if (!user?.id) throw new ForbiddenException('Connectez-vous pour noter ce terrain.');

    const reviews = Array.isArray(pitch.reviews) ? pitch.reviews : [];
    const existingIndex = reviews.findIndex((review: any) => review.userId === user.id);
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
  async createPitch(input: any) {
    const user: any = await this.accounts.profile();
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
    if (!Number.isFinite(rate) || rate < 5 || rate > 1_000_000) {
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
    await this.notifications.add({ title: 'Nouveau terrain disponible', message: `Le terrain "${pitch.name}" est désormais réservable sur Footera.`, type: 'booking', targetSection: 'pitches', targetId: id });
    return pitch;
  }
  async listBookings() {
    const user: any = await this.accounts.profile();
    return (await this.records.list<any>('bookings'))
      .filter((booking) => booking.userId === user?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createBooking(input: any) {
    const [booking] = await this.createBookings({
      pitchId: input.pitchId,
      selections: [{ date: input.date, time: input.time }],
      teamName: input.teamName,
    });
    return booking;
  }
  async cancelBooking(id: string) {
    const booking: any = await this.records.find('bookings', id);
    const user: any = await this.accounts.profile();
    if (!booking || booking.userId !== user?.id) return false;
    if (booking.status === 'CANCELLED') return true;
    await this.records.save('bookings', id, { ...booking, status: 'CANCELLED' });
    try {
      await this.notifications.add({
        title: 'Réservation annulée',
        message: `La réservation pour ${booking.pitchName} du ${booking.date} à ${booking.time} a été annulée.`,
        type: 'booking',
        targetSection: 'bookings',
        targetId: id,
      });
    } catch (error) {
      this.logger.warn(`Booking ${id} was cancelled, but its notification could not be created: ${String(error)}`);
    }
    return true;
  }
}
