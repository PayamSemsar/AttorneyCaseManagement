import {Entity, model, property} from '@loopback/repository';

@model()
export class ReminderCustom extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  reminderCustomID: string;

  @property({
    type: 'number',
    required: true,
  })
  reminderCustomDate: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 255,
    },
  })
  descriptionTitle: string;


  constructor(data?: Partial<ReminderCustom>) {
    super(data);
  }
}

export interface ReminderCustomRelations {
  // describe navigational properties here
}

export type ReminderCustomWithRelations = ReminderCustom & ReminderCustomRelations;
