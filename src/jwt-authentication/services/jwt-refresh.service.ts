import {inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {promisify} from 'util';
import {RefreshTokenService} from '../../services';
import {RefreshTokenServiceBindings} from '../keys';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTRefreshService implements RefreshTokenService {
  constructor(
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SECRET) private jwtRefreshSecret: string,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_EXPIRES_IN) private jwtRefreshExpiresIn: string,
  ) { }

  async verifyRefreshToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    let userProfile: UserProfile;

    try {
      const decodedToken = await verifyAsync(token, this.jwtRefreshSecret);

      userProfile = Object.assign(
        {[securityId]: ''},
        {
          [securityId]: decodedToken.id,
          id: decodedToken.id,
        },
      );
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }
    return userProfile;
  }


  async generateRefreshToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(
        'Error generating token : userProfile is null',
      );
    }
    const userInfoForToken = {
      id: userProfile[securityId],
    };
    // Generate a JSON Web Token
    let token: string;
    try {
      token = await signAsync(userInfoForToken, this.jwtRefreshSecret, {
        expiresIn: Number(this.jwtRefreshExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }
}
