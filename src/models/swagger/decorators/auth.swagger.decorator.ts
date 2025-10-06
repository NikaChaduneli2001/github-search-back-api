import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LoginPayloadDto } from '@src/models/dtos/auth/login-payload.dto';
import { UserLoginDto } from '@src/models/dtos/users/user-login.dto';
import { CreateUserDto } from '@src/models/dtos/users/create-user.dto';
import { RefreshTokenDto } from '@src/models/dtos/auth/refresh-token.dto';

export function ApiSignUp() {
  return applyDecorators(
    ApiOperation({
      summary: 'User registration',
      description: 'Register a new user account',
    }),
    ApiBody({
      type: CreateUserDto,
      description: 'User registration details',
    }),
    ApiResponse({
      status: 201,
      description: 'User successfully registered',
      schema: {
        example: {
          data: {
            id: 1,
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
      schema: {
        example: {
          statusCode: 400,
          message: 'Validation failed',
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - User already exists',
      schema: {
        example: {
          statusCode: 409,
          message: 'User with this email already exists',
          error: 'Conflict',
        },
      },
    }),
  );
}

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Authenticate user and return access tokens',
    }),
    ApiBody({
      type: UserLoginDto,
      description: 'User login credentials',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully authenticated',
      type: LoginPayloadDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid credentials',
      schema: {
        example: {
          statusCode: 400,
          message: 'PASSWORD_OR_EMAIL_INCORRECT',
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - User does not exist',
      schema: {
        example: {
          statusCode: 404,
          message: 'PASSWORD_OR_EMAIL_INCORRECT',
          error: 'Not Found',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        example: {
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        },
      },
    }),
  );
}

export function ApiRefreshToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description: 'Get a new access token using refresh token',
    }),
    ApiBody({
      type: RefreshTokenDto,
      description: 'Refresh token',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully refreshed token',
      type: LoginPayloadDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or expired refresh token',
      schema: {
        example: {
          statusCode: 401,
          message: 'INVALID_TOKEN',
          error: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - User not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'USER_NOT_FOUND',
          error: 'Not Found',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        example: {
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        },
      },
    }),
  );
}

export function ApiAuthController() {
  return applyDecorators(
    ApiTags('Authentication'),
  );
}
