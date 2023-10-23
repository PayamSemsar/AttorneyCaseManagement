import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {ReminderCustom, ReminderCustomRelations} from '../models';

export class ReminderCustomRepository extends DefaultCrudRepository<
  ReminderCustom,
  typeof ReminderCustom.prototype.reminderCustomID,
  ReminderCustomRelations
> {
  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
  ) {
    super(ReminderCustom, dataSource);
  }
}
