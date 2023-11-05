import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {DescriptionComplaint, DescriptionComplaintRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class DescriptionComplaintRepository extends DefaultCrudRepository<
  DescriptionComplaint,
  typeof DescriptionComplaint.prototype.descriptionComplaintID,
  DescriptionComplaintRelations
> {
  public readonly user: BelongsToAccessor<User, string>;

  constructor(
    @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
  ) {
    super(DescriptionComplaint, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
