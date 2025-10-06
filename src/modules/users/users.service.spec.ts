import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UsersService } from './users.service';
import { Users } from '@src/models/entities/users.entity';
import { JwtHelper } from '@src/core/utils';
import { ExceptionMessageCodesEnum } from '@src/core/common/exception-message-code.enum';
import { CreateUserDto } from '@src/models/dtos/users/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<Repository<Users>>;
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

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Users),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: JwtHelper,
          useValue: {
            encodePassword: jest.fn(),
            matches: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(Users));
    jwtHelper = module.get(JwtHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
    };

    it('should successfully create a new user', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      jwtHelper.encodePassword.mockReturnValue('hashedPassword');
      usersRepository.create.mockReturnValue(mockUser as any);
      usersRepository.save.mockResolvedValue(mockUser as Users);

      const result = await service.createUser(createUserDto);

      expect(jwtHelper.encodePassword).toHaveBeenCalledWith('password123');
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        password: 'hashedPassword',
      });
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        data: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });
    });

    it('should throw error if user already exists', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new BadRequestException(ExceptionMessageCodesEnum.USER_ALREADY_EXISTS),
      );

      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error if user could not be created', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      jwtHelper.encodePassword.mockReturnValue('hashedPassword');
      usersRepository.create.mockReturnValue(mockUser as any);
      usersRepository.save.mockResolvedValue(null);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new BadRequestException(ExceptionMessageCodesEnum.USER_COULD_NOT_BE_CREATED),
      );
    });

    it('should hash password before saving', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      jwtHelper.encodePassword.mockReturnValue('hashedPassword123');
      usersRepository.create.mockReturnValue(mockUser as any);
      usersRepository.save.mockResolvedValue(mockUser as Users);

      await service.createUser(createUserDto);

      expect(jwtHelper.encodePassword).toHaveBeenCalledWith(createUserDto.password);
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashedPassword123',
        }),
      );
    });
  });

  describe('checkUserExist', () => {
    it('should return true if user exists', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await service.checkUserExist('test@example.com');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.email = :email', {
        email: 'test@example.com',
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await service.checkUserExist('nonexistent@example.com');

      expect(result).toBe(false);
    });

    it('should handle multiple users with same email (edge case)', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);

      const result = await service.checkUserExist('test@example.com');

      expect(result).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should return user with password and selected fields', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser as Users);

      const result = await service.findByEmail('test@example.com');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: ['password', 'id', 'firstName', 'lastName', 'createdAt'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should include password field in response', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser as Users);

      const result = await service.findByEmail('test@example.com');

      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.arrayContaining(['password']),
        }),
      );
      expect(result?.password).toBeDefined();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser as Users);

      const result = await service.getUserById(1);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById(999)).rejects.toThrow(
        new NotFoundException(ExceptionMessageCodesEnum.USER_NOT_FOUND),
      );
    });

    it('should handle zero as valid user id', async () => {
      const userWithIdZero: Partial<Users> = { ...mockUser, id: 0 };
      usersRepository.findOne.mockResolvedValue(userWithIdZero as Users);

      const result = await service.getUserById(0);

      expect(result).toEqual(userWithIdZero);
    });

    it('should handle negative user id gracefully', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById(-1)).rejects.toThrow(NotFoundException);
    });
  });
});
