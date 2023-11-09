import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {DescriptionComplaint, DescriptionComplaintRelations} from '../models';

export class DescriptionComplaintRepository extends DefaultCrudRepository<
  DescriptionComplaint,
  typeof DescriptionComplaint.prototype.descriptionComplaintID,
  DescriptionComplaintRelations
> {
  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
  ) {
    super(DescriptionComplaint, dataSource);
  }
}
