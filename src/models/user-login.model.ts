import {Entity, model, property} from '@loopback/repository';

@model()
export class UserLogin extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  userName: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;


  constructor(data?: Partial<UserLogin>) {
    super(data);
  }
}

export interface UserLoginRelations {
  // describe navigational properties here
}

export type UserLoginWithRelations = UserLogin & UserLoginRelations;
