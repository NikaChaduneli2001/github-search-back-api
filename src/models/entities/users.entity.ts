import {Column, Entity} from "typeorm";
import {AbstractNumberPkEntity} from "@src/models/core/abstract-number-pk.entity";

@Entity('users')
export class Users  extends AbstractNumberPkEntity {
    @Column("varchar", { length: 50, nullable: false })
    email: string;

    @Column("varchar", { length: 50, nullable: false })
    firstName: string;

    @Column("varchar", { length: 50, nullable: false })
    lastName: string;

    @Column({ type: "varchar", length: 100, select: false })
    password: string;

}