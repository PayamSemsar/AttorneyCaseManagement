import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {CaseEvent, CaseEventRelations} from '../models';

export class CaseEventRepository extends DefaultCrudRepository<
  CaseEvent,
  typeof CaseEvent.prototype.caseEventID,
  CaseEventRelations
> {
  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
  ) {
    super(CaseEvent, dataSource);
  }
}
