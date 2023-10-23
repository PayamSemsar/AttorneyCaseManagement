import {Entity, model, property} from '@loopback/repository';

@model()
export class Token extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  userId: string;

  @property({
    type: 'string',
    required: true,
  })
  accessToken: string;

  @property({
    type: 'string',
    required: true,
  })
  refreshToken: string;


  constructor(data?: Partial<Token>) {
    super(data);
  }
}

export interface TokenRelations {
  // describe navigational properties here
}

export type TokenWithRelations = Token & TokenRelations;
