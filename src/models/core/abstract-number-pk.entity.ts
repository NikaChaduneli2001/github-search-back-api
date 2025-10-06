import { DateAuditEntity } from './date-audit.entity';
import { Index, PrimaryGeneratedColumn } from 'typeorm';

export class AbstractNumberPkEntity extends DateAuditEntity {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;
}
