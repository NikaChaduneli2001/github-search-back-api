import { ApiProperty } from "@nestjs/swagger";

export class TokenPayloadDto {
  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    type: Number
  })
  expiresIn: number;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String
  })
  refreshToken: string;

  @ApiProperty({
    description: 'JWT refresh token expiration time in seconds',
    example: 86400,
    type: Number
  })
  refreshExpiresIn?: string;

  constructor(data: {
    expiresIn: number;
    accessToken: string;
    refreshToken: string;
    refreshExpiresIn?: string;
  }) {
    this.expiresIn = data.expiresIn;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.refreshExpiresIn = data.refreshExpiresIn;
  }
}
