import {Entity, belongsTo, model, property} from '@loopback/repository';
import {codeGenerator} from '../helpers';
import {User} from './user.model';

@model()
export class DescriptionComplaint extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  descriptionComplaintID: string;

  @property({
    type: 'string',
    required: true,
    default: codeGenerator(),
  })
  codeDescriptionComplaint: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 32,
    },
  })
  titleDescriptionComplaint: string;

  @belongsTo(() => User, {
    name: 'user', keyTo: '_id'
  }, {
    required: true,
    type: 'string'
  })
  nationalCodeUserID: string;

  @property({
    type: 'number',
    required: true,
  })
  datePresence: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 255,
    },
  })
  descriptionComplaint: string;

  @property({
    type: 'string',
    required: true,
    default: "check",
  })
  complaintResult: string;


  constructor(data?: Partial<DescriptionComplaint>) {
    super(data);
  }
}

export interface DescriptionComplaintRelations {
  // describe navigational properties here
}

export type DescriptionComplaintWithRelations = DescriptionComplaint & DescriptionComplaintRelations;
