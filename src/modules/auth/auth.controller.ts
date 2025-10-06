import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@src/models/dtos/users/create-user.dto';
import { UserLoginDto } from '@src/models/dtos/users/user-login.dto';
import { LoginPayloadDto } from '@src/models/dtos/auth/login-payload.dto';
import { IUser } from '@src/models/interfaces/user.interface';
import { RefreshTokenDto } from '@src/models/dtos/auth/refresh-token.dto';
import {
  ApiAuthController,
  ApiLogin,
  ApiSignUp,
  ApiRefreshToken,
} from '@src/models/swagger/decorators/auth.swagger.decorator';

@ApiAuthController()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiSignUp()
  async signUp(@Body() createUserDto: CreateUserDto): Promise<{ data: IUser }> {
    return await this.authService.signUp(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  async login(@Body() userLoginDto: UserLoginDto): Promise<LoginPayloadDto> {
    return await this.authService.login(userLoginDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshToken()
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<LoginPayloadDto> {
    return await this.authService.tokenRefresh(refreshTokenDto);
  }
}
