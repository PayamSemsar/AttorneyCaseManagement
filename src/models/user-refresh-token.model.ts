import {Entity, model, property} from '@loopback/repository';

@model()
export class UserRefreshToken extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  userId: string;

  @property({
    type: 'string',
    required: true,
  })
  refreshToken: string;


  constructor(data?: Partial<UserRefreshToken>) {
    super(data);
  }
}

export interface UserRefreshTokenRelations {
  // describe navigational properties here
}

export type UserRefreshTokenWithRelations = UserRefreshToken & UserRefreshTokenRelations;
