import {Entity, model, property} from '@loopback/repository';
import {codeGenerator} from '../helpers';

@model()
export class Case extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  caseID: string;

  @property({
    type: 'string',
    required: true,
    default: codeGenerator(),
  })
  codeCase: string;

  @property({
    type: 'string',
    required: true,
  })
  userNationalCode: string;

  @property({
    type: 'string',
    required: true,
  })
  codeDescriptionComplaint: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minimum: 0,
    },
  })
  petitionNumber: string;

  @property({
    type: 'number',
    required: true,
  })
  dateSet: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minimum: 0,
    },
  })
  caseNumber: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minimum: 0,
    },
  })
  branchArchiveNumber: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
    jsonSchema: {
      minItems: 1,
    },
  })
  accuseds: string[];


  constructor(data?: Partial<Case>) {
    super(data);
  }
}

export interface CaseRelations {
  // describe navigational properties here
}

export type CaseWithRelations = Case & CaseRelations;
