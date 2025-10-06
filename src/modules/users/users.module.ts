import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '@src/models/entities/users.entity';
import { JwtHelper } from '@src/core/utils';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  providers: [UsersService, JwtHelper, JwtService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
