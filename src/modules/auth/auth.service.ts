import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { TokenEntity } from '@src/models/entities/token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtHelper, RandomGenerator } from '@src/core/utils';
import { TokenPayloadDto } from '@src/models/dtos/auth/token-payload.dto';
import { Users } from '@src/models/entities/users.entity';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '@src/modules/users/users.service';
import { IUser } from '@src/models/interfaces/user.interface';
import { ExceptionMessageCodesEnum } from '@src/core/common/exception-message-code.enum';
import { UserLoginDto } from '@src/models/dtos/users/user-login.dto';
import { LoginPayloadDto } from '@src/models/dtos/auth/login-payload.dto';
import { CreateUserDto } from '@src/models/dtos/users/create-user.dto';
import { RefreshTokenDto } from '@src/models/dtos/auth/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,

    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,

    private readonly randomGenerator: RandomGenerator,

    private readonly jwtHelper: JwtHelper,
  ) {}

  async signUp(request: CreateUserDto): Promise<{ data: IUser }> {
    return await this.usersService.createUser(request);
  }

  async login({ email, password }: UserLoginDto): Promise<LoginPayloadDto> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new HttpException(
          ExceptionMessageCodesEnum.PASSWORD_OR_EMAIL_INCORRECT,
          HttpStatus.NOT_FOUND,
        );
      }

      const isPasswordValid = this.jwtHelper.matches(password, user.password);

      if (!isPasswordValid) {
        throw new BadRequestException(
          ExceptionMessageCodesEnum.PASSWORD_OR_EMAIL_INCORRECT,
        );
      }

      const token: TokenPayloadDto = await this.createToken({
        userId: user.id,
      });

      delete user.password;

      return new LoginPayloadDto(user as IUser, token);
    } catch (error) {
      throw error;
    }
  }

  private async createToken(request: {
    userId: number;
  }): Promise<TokenPayloadDto> {
    const { userId } = request;

    const user: Users = await this.usersService.getUserById(userId);

    const expiresIn = 3600;

    const REFRESH_EXPIRATION = {
      DEFAULT: '30d',
    };

    const refreshExpiration = REFRESH_EXPIRATION.DEFAULT;

    const payload = {
      data: {
        id: user.id,
        username: user.firstName,
      },
      sub: user.id,
    };

    const lastToken: TokenEntity = await this.tokenRepository
      .createQueryBuilder('token')
      .where('token.userId = :userId', { userId: user.id })
      .andWhere('token.isRevoked = :isRevoked', { isRevoked: false })
      .getOne();

    let refreshTokenSecretKey = await this.randomGenerator.generateRandomString(
      32,
    );
    if (lastToken) {
      refreshTokenSecretKey = lastToken.token;
    } else {
      const token: TokenEntity = new TokenEntity();
      token.token = refreshTokenSecretKey;
      token.userId = user.id;
      token.isRevoked = false;
      token.type = 'refresh_token';
      await this.tokenRepository.save(token);
    }
    const refreshToken: string = jwt.sign(
      { sub: user.id },
      refreshTokenSecretKey,
      {
        expiresIn: refreshExpiration,
      },
    );
    return new TokenPayloadDto({
      expiresIn,
      refreshExpiresIn: refreshExpiration,
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn,
        secret: this.configService.get('JWT_SECRET'),
      }),
      refreshToken,
    });
  }

  async tokenRefresh(dto: RefreshTokenDto): Promise<LoginPayloadDto> {
    try {
      const decodedRefreshToken = await this.checkRefreshToken(dto);
      const subUserId = decodedRefreshToken.sub;

      if (!subUserId) {
        throw new HttpException(
          ExceptionMessageCodesEnum.INVALID_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const subUserEntity = await this.usersService.getUserById(subUserId);

      if (!subUserEntity) {
        throw new HttpException(
          ExceptionMessageCodesEnum.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const token: TokenPayloadDto = await this.createToken({
        userId: subUserEntity.id,
      });

      delete subUserEntity.password;

      return new LoginPayloadDto(subUserEntity as IUser, token);
    } catch (error) {
      throw error;
    }
  }

  private async checkRefreshToken({ refreshToken }: RefreshTokenDto) {
    const decodeToken: any = jwt.decode(refreshToken);

    if (!decodeToken || !decodeToken.sub) {
      throw new HttpException(
        ExceptionMessageCodesEnum.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const lastTokenSecret: TokenEntity = await this.tokenRepository
      .createQueryBuilder('token')
      .where('token.userId = :userId', { userId: decodeToken.sub })
      .andWhere('token.isRevoked = :isRevoked', { isRevoked: false })
      .getOne();

    if (!lastTokenSecret) {
      throw new HttpException(
        ExceptionMessageCodesEnum.REFRESH_TOKEN_NOT_FOUND,
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      return jwt.verify(refreshToken, lastTokenSecret.token);
    } catch (error) {
      await this.tokenRepository.save({ ...lastTokenSecret, isRevoked: true });

      if (error.name === 'TokenExpiredError') {
        throw new HttpException(
          ExceptionMessageCodesEnum.TOKEN_EXPIRED,
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new HttpException(
        ExceptionMessageCodesEnum.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
