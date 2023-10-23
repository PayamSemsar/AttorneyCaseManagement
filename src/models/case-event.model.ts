import {Entity, model, property} from '@loopback/repository';

@model()
export class CaseEvent extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  caseEventID: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 255,
    },
  })
  descriptionEvent: string;

  @property({
    type: 'string',
    required: true,
  })
  codeCase: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  fileImage: string[];

  @property({
    type: 'number',
    required: true,
  })
  dateRecord: number;

  @property({
    type: 'number',
    required: true,
  })
  dateDo: number;


  constructor(data?: Partial<CaseEvent>) {
    super(data);
  }
}

export interface CaseEventRelations {
  // describe navigational properties here
}

export type CaseEventWithRelations = CaseEvent & CaseEventRelations;
