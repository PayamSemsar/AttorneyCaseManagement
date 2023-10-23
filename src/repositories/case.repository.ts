import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {Case, CaseRelations} from '../models';

export class CaseRepository extends DefaultCrudRepository<
  Case,
  typeof Case.prototype.caseID,
  CaseRelations
> {
  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
  ) {
    super(Case, dataSource);
  }
}
