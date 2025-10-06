import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '@src/models/entities/users.entity';
import { Repository } from 'typeorm';
import { ExceptionMessageCodesEnum } from '@src/core/common/exception-message-code.enum';
import { CreateUserDto } from '@src/models/dtos/users/create-user.dto';
import { JwtHelper } from '@src/core/utils';
import { IUser } from '@src/models/interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,

    private readonly jwtHelper: JwtHelper,
  ) {}

  async createUser(request: CreateUserDto): Promise<{ data: IUser }> {
    const { email, firstName, lastName, password } = request;

    const userExists = await this.checkUserExist(email);

    if (userExists) {
      throw new BadRequestException(
        ExceptionMessageCodesEnum.USER_ALREADY_EXISTS,
      );
    }

    const hashedPassword = this.jwtHelper.encodePassword(password);

    const user = this.usersRepository.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
    });
    const createdUser = await this.usersRepository.save(user);

    if (!createdUser) {
      throw new BadRequestException(
        ExceptionMessageCodesEnum.USER_COULD_NOT_BE_CREATED,
      );
    }

    return {
      data: {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
      },
    };
  }

  async checkUserExist(email: string): Promise<boolean> {
    const userCount = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getCount();

    return userCount > 0;
  }

  async findByEmail(email: string): Promise<Users> {
    return await this.usersRepository.findOne({
      where: { email },
      select: ['password', 'id', 'firstName', 'lastName', 'createdAt'],
    });
  }

  async getUserById(id: number): Promise<Users> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(ExceptionMessageCodesEnum.USER_NOT_FOUND);
    }
    return user;
  }
}
