import {BindingKey} from '@loopback/core';
import {User} from '../models';
import {RefreshTokenService, TokenService, UserService} from '../services';
export namespace TokenServiceConstants {
  export const TOKEN_SECRET_VALUE = 'myjwts3cr3t';
  export const TOKEN_EXPIRES_IN_VALUE = '300';
}
export namespace RefreshTokenServiceConstants {
  export const REFRESH_TOKEN_SECRET_VALUE = 'ayswts2cb5t';
  export const REFRESH_TOKEN_EXPIRES_IN_VALUE = '1800';
}

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.tokensecret',
  );
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.token.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

export namespace RefreshTokenServiceBindings {
  export const REFRESH_TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.refreshtokensecret',
  );
  export const REFRESH_TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.refresh.token.expires.in.seconds',
  );
  export const REFRESH_TOKEN_SERVICE = BindingKey.create<RefreshTokenService>(
    'services.authentication.jwt.refreshtokenservice',
  );
}


export namespace UserServiceBindings {
  export const USER_SERVICE = BindingKey.create<UserService<User>>(
    'services.user.service',
  );
}
