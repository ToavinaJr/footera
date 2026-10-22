import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';
import { validateImageUrl } from '../uploads/image-url.validation.js';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService, private readonly notifications: NotificationsService) {}
  async listPitches(filters: { city?: string; surface?: string; date?: string } = {}) {
    const pitches: any[] = await this.records.list('pitches');
    const bookings = filters.date ? await this.records.list<any>('bookings') : [];
    return pitches
      .filter((pitch) => (!filters.city || filters.city === 'Toutes' || pitch.city?.toLowerCase().includes(filters.city.toLowerCase()))
        && (!filters.surface || filters.surface === 'Toutes' || pitch.surface === filters.surface))
      .map((pitch) => this.withDateAvailability(pitch, bookings, filters.date));
  }
  async getPitch(id: string, date?: string) {
    const pitch: any = await this.records.find('pitches', id);
    if (!pitch || !date) return pitch;
    const bookings = await this.records.list<any>('bookings');
    return this.withDateAvailability(pitch, bookings, date);
  }
  private withDateAvailability(pitch: any, bookings: any[], date?: string) {
    if (!date) return pitch;
    const bookedTimes = new Set(bookings
      .filter((booking) => booking.pitchId === pitch.id && booking.date === date && booking.status !== 'CANCELLED')
      .map((booking) => booking.time));
    return {
      ...pitch,
      availableSlots: (pitch.availableSlots || []).map((slot: any) => ({
        ...slot,
        isAvailable: Boolean(slot.isAvailable) && !bookedTimes.has(slot.time),
      })),
    };
  }
  async createPitch(input: any) {
    input.imageUrl = validateImageUrl(input.imageUrl, 'Photo du terrain');
    const id = `pitch_${randomUUID()}`;
    const pitch = { ...input, id, rating: 5, reviewsCount: 1, amenities: input.amenities || [], availableSlots: input.availableSlots || [] };
    await this.records.create('pitches', id, pitch);
    await this.notifications.add({ title: 'Nouveau terrain disponible', message: `Le terrain "${pitch.name}" est désormais réservable sur Footera.`, type: 'booking', targetSection: 'pitches', targetId: id });
    return pitch;
  }
  async listBookings() { return (await this.records.list<any>('bookings')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async createBooking(input: any) {
    const [pitch, user]: any[] = await Promise.all([this.getPitch(input.pitchId), this.accounts.profile()]);
    if (!pitch) throw new ConflictException('Ce terrain n’est plus disponible.');
    const existingBookings = await this.records.list<any>('bookings');
    const slot = (pitch.availableSlots || []).find((candidate: any) => candidate.time === input.time && candidate.isAvailable);
    const alreadyBooked = existingBookings.some((booking) => booking.pitchId === input.pitchId
      && booking.date === input.date && booking.time === input.time && booking.status !== 'CANCELLED');
    if (!slot || alreadyBooked) throw new ConflictException('Ce créneau n’est plus disponible pour cette date.');
    const id = `bkg_${randomUUID()}`;
    const booking = {
      id, pitchId: input.pitchId, pitchName: pitch?.name || 'Terrain réservé',
      complexName: pitch?.complexName || 'Complexe Footera', surface: pitch?.surface || 'Synthétique',
      date: input.date, time: input.time, durationMinutes: 90, totalPrice: slot.price,
      bookerName: user?.name || 'Joueur Footera', bookerPhone: user?.phone || '',
      teamName: input.teamName || user?.sportsCv?.currentTeam || 'Footera FC',
      status: 'CONFIRMED', createdAt: new Date().toISOString(),
    };
    await this.records.create('bookings', id, booking);
    await this.notifications.add({ title: 'Réservation confirmée', message: `Créneau validé le ${booking.date} à ${booking.time} (${booking.pitchName}).`, type: 'booking', targetSection: 'bookings', targetId: id });
    return booking;
  }
  async cancelBooking(id: string) {
    const booking: any = await this.records.find('bookings', id);
    if (!booking) return false;
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
