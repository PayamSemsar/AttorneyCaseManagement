import {Entity, model, property} from '@loopback/repository';
import {codeGenerator} from '../helpers';

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
    jsonSchema: {
      minLength: 12,
      maxLength: 12,
    },
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

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 10,
      maxLength: 10,
    },
  })
  nationalCodeUser: string;

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
