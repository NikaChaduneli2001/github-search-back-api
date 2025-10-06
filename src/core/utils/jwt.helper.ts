import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class JwtHelper {
  constructor(private readonly jwt: JwtService) {}
  // Validate JWT Token, throw forbidden error if JWT Token is invalid
  // eslint-disable-next-line consistent-return
  public async verify(token: string, secret: string) {
    try {
      return this.jwt.verify(token, { secret });
    } catch (err) {
      throw new UnauthorizedException(err);
    }
  }

  // Encode User's password
  public encodePassword(password: string): string {
    const salt: string = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  public matches(password: string, passwordHash: string): boolean {
    return bcrypt.compareSync(password, passwordHash);
  }
}
