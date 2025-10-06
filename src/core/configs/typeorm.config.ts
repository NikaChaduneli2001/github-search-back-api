import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from '../common/snake-naming-startegy';

export const getTypeORMConfig = (): TypeOrmModuleAsyncOptions => ({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return {
      type: 'postgres',
      host: configService.get('PG_HOST'),
      port: +configService.get('PG_PORT') || 5432,
      database: configService.get('PG_DATABASE'),
      username: configService.get('PG_USERNAME'),
      password: configService.get('PG_PASSWORD'),
      entities: [join(__dirname, '..', '..', './**/*.entity{.ts,.js}')],
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: true, // Change to false in production
      retryAttempts: 10,
      retryDelay: 3000,
      autoLoadEntities: true,
    };
  },
});
