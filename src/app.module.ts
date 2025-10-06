import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {ConfigModule} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {JwtModule} from "@nestjs/jwt";
import {getTypeORMConfig} from "@src/core/configs/typeorm.config";
import {getJWTConfig} from "@src/core/configs/jwt.config";
import {AuthModule} from "@src/modules/auth/auth.module";
import {GithubModule} from "@src/modules/github/github.module";
import { contextMiddleware } from './core/middlewares/context.middlware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync(getTypeORMConfig()),
    JwtModule.registerAsync(getJWTConfig()),
      AuthModule,
      GithubModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(contextMiddleware).forRoutes("*");
  }
}
