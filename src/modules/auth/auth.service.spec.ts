import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { UsersService } from '@src/modules/users/users.service';
import { TokenEntity } from '@src/models/entities/token.entity';
import { Users } from '@src/models/entities/users.entity';
import { JwtHelper, RandomGenerator } from '@src/core/utils';
import { ExceptionMessageCodesEnum } from '@src/core/common/exception-message-code.enum';
import { CreateUserDto } from '@src/models/dtos/users/create-user.dto';
import { UserLoginDto } from '@src/models/dtos/users/user-login.dto';
import { RefreshTokenDto } from '@src/models/dtos/auth/refresh-token.dto';

jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let tokenRepository: jest.Mocked<Repository<TokenEntity>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let randomGenerator: jest.Mocked<RandomGenerator>;
  let jwtHelper: jest.Mocked<JwtHelper>;

  const mockUser: Partial<Users> = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockToken: Partial<TokenEntity> = {
    id: 1,
    token: 'randomSecretKey123',
    userId: 1,
    isRevoked: false,
    type: 'refresh_token',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(TokenEntity),
          useValue: {
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            findByEmail: jest.fn(),
            getUserById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: RandomGenerator,
          useValue: {
            generateRandomString: jest.fn(),
          },
        },
        {
          provide: JwtHelper,
          useValue: {
            matches: jest.fn(),
            encodePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    tokenRepository = module.get(getRepositoryToken(TokenEntity));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    randomGenerator = module.get(RandomGenerator);
    jwtHelper = module.get(JwtHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123',
      };

      const expectedResult = {
        data: {
          id: 1,
          email: createUserDto.email,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
        },
      };

      usersService.createUser.mockResolvedValue(expectedResult);

      const result = await service.signUp(createUserDto);

      expect(usersService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from usersService', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password',
      };

      usersService.createUser.mockRejectedValue(
        new BadRequestException(ExceptionMessageCodesEnum.USER_ALREADY_EXISTS),
      );

      await expect(service.signUp(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto: UserLoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as Users);
      jwtHelper.matches.mockReturnValue(true);
      usersService.getUserById.mockResolvedValue(mockUser as Users);
      mockQueryBuilder.getOne.mockResolvedValue(mockToken as TokenEntity);
      randomGenerator.generateRandomString.mockResolvedValue('randomKey');
      jwtService.signAsync.mockResolvedValue('accessToken123');
      configService.get.mockReturnValue('secret');
      (jwt.sign as jest.Mock).mockReturnValue('refreshToken123');

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(jwtHelper.matches).toHaveBeenCalledWith(loginDto.password, 'hashedPassword123');
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw error if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException(
          ExceptionMessageCodesEnum.PASSWORD_OR_EMAIL_INCORRECT,
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(jwtHelper.matches).not.toHaveBeenCalled();
    });

    it('should throw error if password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as Users);
      jwtHelper.matches.mockReturnValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new BadRequestException(ExceptionMessageCodesEnum.PASSWORD_OR_EMAIL_INCORRECT),
      );
    });

    it('should create new token if no existing token found', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as Users);
      jwtHelper.matches.mockReturnValue(true);
      usersService.getUserById.mockResolvedValue(mockUser as Users);
      mockQueryBuilder.getOne.mockResolvedValue(null);
      randomGenerator.generateRandomString.mockResolvedValue('newRandomKey');
      jwtService.signAsync.mockResolvedValue('accessToken');
      configService.get.mockReturnValue('secret');
      (jwt.sign as jest.Mock).mockReturnValue('refreshToken');
      tokenRepository.save.mockResolvedValue(mockToken as TokenEntity);

      await service.login(loginDto);

      expect(randomGenerator.generateRandomString).toHaveBeenCalledWith(32);
      expect(tokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          isRevoked: false,
          type: 'refresh_token',
        }),
      );
    });

    it('should reuse existing token if found', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as Users);
      jwtHelper.matches.mockReturnValue(true);
      usersService.getUserById.mockResolvedValue(mockUser as Users);
      mockQueryBuilder.getOne.mockResolvedValue(mockToken as TokenEntity);
      jwtService.signAsync.mockResolvedValue('accessToken');
      configService.get.mockReturnValue('secret');
      (jwt.sign as jest.Mock).mockReturnValue('refreshToken');

      await service.login(loginDto);

      expect(tokenRepository.save).not.toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: mockUser.id },
        mockToken.token,
        expect.any(Object),
      );
    });
  });

  describe('tokenRefresh', () => {
    const refreshDto: RefreshTokenDto = {
      refreshToken: 'validRefreshToken',
    };

    it('should successfully refresh token', async () => {
      const decodedToken = { sub: 1 };
      (jwt.decode as jest.Mock).mockReturnValue(decodedToken);
      mockQueryBuilder.getOne.mockResolvedValue(mockToken as TokenEntity);
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      usersService.getUserById.mockResolvedValue(mockUser as Users);
      jwtService.signAsync.mockResolvedValue('newAccessToken');
      configService.get.mockReturnValue('secret');
      (jwt.sign as jest.Mock).mockReturnValue('newRefreshToken');

      const result = await service.tokenRefresh(refreshDto);

      expect(jwt.decode).toHaveBeenCalledWith(refreshDto.refreshToken);
      expect(jwt.verify).toHaveBeenCalledWith(refreshDto.refreshToken, mockToken.token);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw error if token cannot be decoded', async () => {
      (jwt.decode as jest.Mock).mockReturnValue(null);

      await expect(service.tokenRefresh(refreshDto)).rejects.toThrow(
        new HttpException(ExceptionMessageCodesEnum.INVALID_TOKEN, HttpStatus.UNAUTHORIZED),
      );
    });

    it('should throw error if decoded token has no sub', async () => {
      (jwt.decode as jest.Mock).mockReturnValue({});

      await expect(service.tokenRefresh(refreshDto)).rejects.toThrow(
        new HttpException(ExceptionMessageCodesEnum.INVALID_TOKEN, HttpStatus.UNAUTHORIZED),
      );
    });

    it('should throw error if token not found in database', async () => {
      (jwt.decode as jest.Mock).mockReturnValue({ sub: 1 });
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.tokenRefresh(refreshDto)).rejects.toThrow(
        new HttpException(
          ExceptionMessageCodesEnum.REFRESH_TOKEN_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw error if token is expired', async () => {
      const decodedToken = { sub: 1 };
      (jwt.decode as jest.Mock).mockReturnValue(decodedToken);
      mockQueryBuilder.getOne.mockResolvedValue(mockToken as TokenEntity);
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });
      tokenRepository.save.mockResolvedValue(mockToken as TokenEntity);

      await expect(service.tokenRefresh(refreshDto)).rejects.toThrow(
        new HttpException(ExceptionMessageCodesEnum.TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED),
      );

      expect(tokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isRevoked: true,
        }),
      );
    });

    it('should throw error if token verification fails', async () => {
      const decodedToken = { sub: 1 };
      (jwt.decode as jest.Mock).mockReturnValue(decodedToken);
      mockQueryBuilder.getOne.mockResolvedValue(mockToken as TokenEntity);
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      tokenRepository.save.mockResolvedValue(mockToken as TokenEntity);

      await expect(service.tokenRefresh(refreshDto)).rejects.toThrow(
        new HttpException(ExceptionMessageCodesEnum.INVALID_TOKEN, HttpStatus.UNAUTHORIZED),
      );
    });

    it('should throw error if user not found after token verification', async () => {
      const decodedToken = { sub: 1 };
      (jwt.decode as jest.Mock).mockReturnValue(decodedToken);
      mockQueryBuilder.getOne.mockResolvedValue(mockToken as TokenEntity);
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      usersService.getUserById.mockResolvedValue(null);

      await expect(service.tokenRefresh(refreshDto)).rejects.toThrow(
        new HttpException(ExceptionMessageCodesEnum.USER_NOT_FOUND, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw error if sub is missing after verification', async () => {
      const decodedToken = { sub: 1 };
      (jwt.decode as jest.Mock).mockReturnValue(decodedToken);
      mockQueryBuilder.getOne.mockResolvedValue(mockToken as TokenEntity);
      (jwt.verify as jest.Mock).mockReturnValue({});

      await expect(service.tokenRefresh(refreshDto)).rejects.toThrow(HttpException);
    });
  });
});
