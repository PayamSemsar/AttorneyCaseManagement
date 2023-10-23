// Copyright IBM Corp. and LoopBack contributors 2020. All Rights Reserved.
// Node module: @loopback/example-access-control-migration
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {repository} from '@loopback/repository';
import {securityId} from '@loopback/security';
import {User} from '../../models';
import {UserRepository} from '../../repositories';
import {UserService} from '../../services';


export class MyUserService implements UserService<User> {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
  ) { }

  convertToUserProfile(user: User): any {
    return {
      id: user.userID,
      [securityId]: user.userID.toString(),
    };
  }
}
