import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {FinaneialPayment, FinaneialPaymentRelations} from '../models';

export class FinaneialPaymentRepository extends DefaultCrudRepository<
  FinaneialPayment,
  typeof FinaneialPayment.prototype.finaneialPaymentID,
  FinaneialPaymentRelations
> {
  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
  ) {
    super(FinaneialPayment, dataSource);
  }
}
