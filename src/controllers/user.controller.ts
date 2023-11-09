import {authenticate} from '@loopback/authentication';
import {authorize} from "@loopback/authorization";
import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef, HttpErrors, param,
  post,
  requestBody,
  response
} from '@loopback/rest';
import {RoleKeys} from '../enums';
import {RefreshTokenServiceBindings, TokenServiceBindings, UserServiceBindings} from '../jwt-authentication';
import {FinaneialPayment, Token, User, UserLogin, UserRefreshToken} from '../models';
import {DescriptionComplaintRepository, FinaneialPaymentRepository, UserRepository} from '../repositories';
import {basicAuthorization, RefreshTokenService, TokenService, UserService} from '../services';
import {Tokens} from '../types/token.type';
// import {Tokens} from '../types';

export class UserController {
  constructor(
    @repository(FinaneialPaymentRepository) public finaneialPaymentRepository: FinaneialPaymentRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(DescriptionComplaintRepository) public descriptionComplaintRepository: DescriptionComplaintRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public jwtService: TokenService,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE) public jwtRefreshService: RefreshTokenService,
    @inject(UserServiceBindings.USER_SERVICE) public userService: UserService<User>,
  ) { }

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

  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/users/{skip}/{limit}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {
          exclude: ['addressOne', 'addressTwo', 'codePost', 'phoneNumber', 'role']
        })
      },
    },
  })
  async getUsers(
    @param.path.number("skip") skip: number,
    @param.path.number("limit") limit: number,
  ): Promise<User[]> {
    const data = await this.userRepository.find({skip, limit, fields: {firstName: true, familyName: true, nationalCode: true, userID: true}, where: {role: RoleKeys.User}});
    return data;
  }


  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/user/{id}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {
          exclude: ['addressOne', 'addressTwo', 'codePost', 'phoneNumber', 'role']
        })
      },
    },
  })
  async getUserByID(
    @param.path.string("id") userId: string,
  ): Promise<User | null> {
    const data = await this.userRepository.findOne({
      where: {userID: userId},
      fields: {firstName: true, familyName: true, nationalCode: true, userID: true}
    });
    return data;
  }



  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/user/finaneial-payment/{id}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(FinaneialPayment, {
          exclude: ['nationalCodeUserID', "codeDescriptionComplaint"]
        })
      },
    },
  })
  async getFinaneialPaymentUser(
    @param.path.string("id") userId: string,
  ): Promise<FinaneialPayment[]> {
    const data = await this.finaneialPaymentRepository.find({
      where: {nationalCodeUserID: userId},
      fields: {nationalCodeUserID: false, codeDescriptionComplaint: false}
    });
    return data;
  }


  // auth ---------------------------------------------->
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
