import { applyDecorators, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JWTAuthGuard } from '@src/core/guards/jwt-auth.guard';
import { AuthUserInterceptor } from '@src/core/interceptors/auth-user.interceptor';

export function Auth() {
  return applyDecorators(
    UseGuards(JWTAuthGuard),
    ApiBearerAuth(),
    UseInterceptors(AuthUserInterceptor),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
