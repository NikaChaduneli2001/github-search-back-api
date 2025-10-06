import {Column, Entity, Index} from "typeorm";
import { AbstractNumberPkEntity } from '@src/models/core/abstract-number-pk.entity';

@Entity('tokens')
export class TokenEntity extends AbstractNumberPkEntity {
    @Column({ name: 'user_id' })
    @Index()
    userId: number;

    @Column()
    @Index()
    token: string;

    @Column()
    @Index()
    type: string;

    @Column({ name: 'is_revoked', type: 'boolean', default: false })
    @Index()
    isRevoked: boolean;
}