import {UserProfile} from '@loopback/security';
/**
 * An interface for generating and verifying a token
 */
export interface TokenService {
  verifyToken(token: string): Promise<UserProfile>;

  generateToken(userProfile: UserProfile): Promise<string>;
}
