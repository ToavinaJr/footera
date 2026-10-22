import { Injectable } from '@nestjs/common';
import { RecordRepository } from '../../database/record.repository.js';

@Injectable()
export class ClubsService {
  constructor(private readonly records: RecordRepository) {}
  list() { return this.records.list('clubs'); }
}
