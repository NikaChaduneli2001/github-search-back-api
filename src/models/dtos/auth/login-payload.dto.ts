import { ApiProperty } from "@nestjs/swagger";
import { HttpStatus } from "@nestjs/common";

import { TokenPayloadDto } from "./token-payload.dto";
import { IUser } from "@src/models/interfaces/user.interface";

export class LoginPayloadDto {
  @ApiProperty({
    description: 'User information'
  })
  user: IUser;

  @ApiProperty({ 
    description: 'Authentication tokens',
    type: () => TokenPayloadDto 
  })
  token: TokenPayloadDto;

  @ApiProperty({
    description: 'HTTP status code of the response',
    example: HttpStatus.OK,
    enum: HttpStatus
  })
  status: HttpStatus;

  constructor(user: IUser, token: TokenPayloadDto) {
    this.user = user;
    this.token = token;
    this.status = HttpStatus.OK;
  }
}
