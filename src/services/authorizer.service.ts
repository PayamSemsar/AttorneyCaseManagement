import {AuthorizationContext, AuthorizationDecision, AuthorizationMetadata} from '@loopback/authorization';
import {UserProfile, securityId} from '@loopback/security';
import _ from 'lodash';
import {MongodbDataSource} from '../datasources';
import {UserRepository} from '../repositories';
const dataSource = new MongodbDataSource()
const userRep = new UserRepository(dataSource)


export async function basicAuthorization(
  authorizationCtx: AuthorizationContext,
  metadata: AuthorizationMetadata,

): Promise<AuthorizationDecision> {
  let currentUser: UserProfile;
  if (authorizationCtx.principals.length > 0) {
    const user = _.pick(authorizationCtx.principals[0], [
      'id',
    ]);
    const userRole = await userRep.findById(user.id, {fields: {role: true}})

    currentUser = {[securityId]: user.id, role: userRole.role};
  } else {
    return AuthorizationDecision.DENY;
  }

  if (!currentUser.role) {
    return AuthorizationDecision.DENY;
  }

  if (!metadata.allowedRoles) {
    return AuthorizationDecision.ALLOW;
  }

  let roleIsAllowed = false;
  for (const role of metadata.allowedRoles) {
    if (role == currentUser.role) {
      roleIsAllowed = true;
      break;
    }
  }

  if (!roleIsAllowed) {
    return AuthorizationDecision.DENY;
  }


  if (currentUser[securityId] === authorizationCtx.invocationContext.args[0]) {
    return AuthorizationDecision.ALLOW;
  }

  return AuthorizationDecision.ALLOW;
}
