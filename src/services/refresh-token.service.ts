import {UserProfile} from '@loopback/security';
/**
 * An interface for generating and verifying a token
 */
export interface RefreshTokenService {
  verifyRefreshToken(token: string): Promise<UserProfile>;

  generateRefreshToken(userProfile: UserProfile): Promise<string>;
}
