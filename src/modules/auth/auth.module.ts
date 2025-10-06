import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from '@src/models/entities/token.entity';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '@src/modules/users/users.module';
import { JwtHelper, RandomGenerator } from '@src/core/utils';
import { JwtStrategy } from '@src/core/strategies/jwt.strategy';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([TokenEntity]),
    PassportModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtHelper,
    JwtStrategy,
    JwtService,
    RandomGenerator,
    ConfigService,
  ],
  exports: [AuthService, PassportModule, JwtHelper],
})
export class AuthModule {}
