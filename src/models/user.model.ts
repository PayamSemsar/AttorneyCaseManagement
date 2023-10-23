import {Entity, model, property} from '@loopback/repository';

@model()
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  userID: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 20,
    },
  })
  firstName: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 20,
    },
  })
  familyName: string;

  @property({
    type: 'string',
    jsonSchema: {
      maxLength: 255,
    },
  })
  addressOne?: string;

  @property({
    type: 'string',
    jsonSchema: {
      maxLength: 255,
    },
  })
  addressTwo?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 11,
      maxLength: 11,
    },
  })
  phoneNumber: string;

  @property({
    type: 'string',
  })
  codePost?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 10,
      maxLength: 10,
    }
  })
  nationalCode: string;


  @property({
    type: 'string',
    required: true,
    default: 'user',
  })
  role: string;


  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
