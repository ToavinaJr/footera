import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccountsService } from '../accounts/accounts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordRepository } from '../../database/record.repository.js';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(private readonly records: RecordRepository, private readonly accounts: AccountsService, private readonly notifications: NotificationsService) {}
  async listPitches(filters: { city?: string; surface?: string } = {}) {
    const pitches: any[] = await this.records.list('pitches');
    return pitches.filter((pitch) => (!filters.city || filters.city === 'Toutes' || pitch.city?.toLowerCase().includes(filters.city.toLowerCase()))
      && (!filters.surface || filters.surface === 'Toutes' || pitch.surface === filters.surface));
  }
  getPitch(id: string) { return this.records.find('pitches', id); }
  async createPitch(input: any) {
    const id = `pitch_${randomUUID()}`;
    const pitch = { ...input, id, rating: 5, reviewsCount: 1, amenities: input.amenities || [], availableSlots: input.availableSlots || [] };
    await this.records.create('pitches', id, pitch);
    await this.notifications.add({ title: 'Nouveau terrain disponible', message: `Le terrain "${pitch.name}" est désormais réservable sur Footera.`, type: 'booking', targetSection: 'pitches', targetId: id });
    return pitch;
  }
  async listBookings() { return (await this.records.list<any>('bookings')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async createBooking(input: any) {
    const [pitch, user]: any[] = await Promise.all([this.getPitch(input.pitchId), this.accounts.profile()]);
    const id = `bkg_${randomUUID()}`;
    const booking = {
      id, pitchId: input.pitchId, pitchName: pitch?.name || 'Terrain réservé',
      complexName: pitch?.complexName || 'Complexe Footera', surface: pitch?.surface || 'Synthétique',
      date: input.date, time: input.time, durationMinutes: 90, totalPrice: input.totalPrice,
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
      await this.notifications.add({ title: 'Réservation annulée', message: `La réservation ${id} a été annulée.`, type: 'booking', targetSection: 'bookings', targetId: id });
    } catch (error) {
      this.logger.warn(`Booking ${id} was cancelled, but its notification could not be created: ${String(error)}`);
    }
    return true;
  }
}
