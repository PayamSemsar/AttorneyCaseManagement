import {Entity, model, property} from '@loopback/repository';

@model()
export class FinaneialPayment extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  finaneialPaymentID: string;

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
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 1000,
    },
  })
  price: number;

  @property({
    type: 'number',
    required: true,
  })
  date: number;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  fileImage: string[];


  constructor(data?: Partial<FinaneialPayment>) {
    super(data);
  }
}

export interface FinaneialPaymentRelations {
  // describe navigational properties here
}

export type FinaneialPaymentWithRelations = FinaneialPayment & FinaneialPaymentRelations;
