import {authenticate} from '@loopback/authentication';
import {authorize} from "@loopback/authorization";
import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {
  HttpErrors,
  getModelSchemaRef,
  post,
  requestBody,
  response
} from '@loopback/rest';
import {RoleKeys} from '../enums';
import {RefreshTokenServiceBindings, TokenServiceBindings, UserServiceBindings} from '../jwt-authentication';
import {Token, User, UserLogin, UserRefreshToken} from '../models';
import {UserRepository} from '../repositories';
import {RefreshTokenService, TokenService, UserService, basicAuthorization} from '../services';
import {Tokens} from '../types';

export class UserController {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE)
    public jwtRefreshService: RefreshTokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<User>,

  ) {

  }

  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @post('/user/create')
  @response(200)
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            exclude: ['userID', 'role'],
          }),
        },
      },
    })
    user: User,
  ): Promise<void> {
    const findByNationalCode = await this.userRepository.findOne({where: {nationalCode: user.nationalCode}})
    if (findByNationalCode) throw new HttpErrors[401]("همچین کاربر وجود دارد");
    const PN = (user.phoneNumber.toString()).split("", 2);
    if (!(PN.join('') == "09")) throw new HttpErrors[422]('مفادیر صحیح نمیباشند');
    await this.userRepository.create(user);
  }

  @post('/auth/login')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(Token)
      },
    },
  })
  async Login(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserLogin),
        },
      },
    })
    userlogin: UserLogin,
  ): Promise<Tokens> {
    const findUser = await this.userRepository.findOne({where: {nationalCode: userlogin.userName, phoneNumber: userlogin.password}})
    if (!findUser) throw new HttpErrors.Unauthorized("همچین کاربری وجود ندارد");

    const user = this.userService.convertToUserProfile(findUser)

    const token = await this.jwtService.generateToken(user)
    const RefToken = await this.jwtRefreshService.generateRefreshToken(user)


    const tokens = {
      userId: findUser.userID,
      accessToken: token,
      refreshToken: RefToken,
    }

    return tokens;
  }

  @post('/auth/refresh')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(Token)
      },
    },
  })
  async refresh(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserRefreshToken),
        },
      },
    })
    userRefresh: UserRefreshToken,
  ): Promise<Tokens> {
    const findUser = await this.userRepository.findOne({where: {userID: userRefresh.userId}});
    if (!findUser) throw new HttpErrors.Unauthorized('ای دی کاربر مورد نظر صحیح نمیباشد');
    const refreshVerify = await this.jwtRefreshService.verifyRefreshToken(userRefresh.refreshToken)
    if (refreshVerify.id !== findUser.userID) throw new HttpErrors.Unauthorized('رفرش توکن برای این کاربر نیست');


    const user = this.userService.convertToUserProfile(findUser)
    const token = await this.jwtService.generateToken(user)
    const RefToken = await this.jwtRefreshService.generateRefreshToken(user)


    const tokens = {
      userId: findUser.userID,
      accessToken: token,
      refreshToken: RefToken,
    }

    return tokens;
  }


}
