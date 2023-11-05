import {Entity, model, property} from '@loopback/repository';

@model()
export class DescriptionComplaints extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  codeDescriptionComplaint: string;

  @property({
    type: 'string',
    required: true,
  })
  titleDescriptionComplaint: string;

  @property({
    type: 'string',
    required: true,
  })
  complaintResult: string;


  constructor(data?: Partial<DescriptionComplaints>) {
    super(data);
  }
}

export interface DescriptionComplaintRelations {
  // describe navigational properties here
}

export type DescriptionComplaintWithRelations = DescriptionComplaints & DescriptionComplaintRelations;
