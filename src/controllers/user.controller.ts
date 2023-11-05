import {authenticate} from '@loopback/authentication';
import {authorize} from "@loopback/authorization";
import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {
  HttpErrors,
  get,
  getModelSchemaRef,
  param,
  post,
  requestBody,
  response
} from '@loopback/rest';
import {RoleKeys} from '../enums';
import {RefreshTokenServiceBindings, TokenServiceBindings, UserServiceBindings} from '../jwt-authentication';
import {FinaneialPayment, Token, User, UserLogin, UserRefreshToken, Users} from '../models';
import {DescriptionComplaints} from '../models/description-complaints.model';
import {DescriptionComplaintRepository, FinaneialPaymentRepository, UserRepository} from '../repositories';
import {RefreshTokenService, TokenService, UserService, basicAuthorization} from '../services';
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
        schema: getModelSchemaRef(Users)
      },
    },
  })
  async getUsers(
    @param.path.number("skip") skip: number,
    @param.path.number("limit") limit: number,
  ): Promise<Users[]> {
    const data = await this.userRepository.find({skip, limit, fields: {firstName: true, familyName: true, nationalCode: true, userID: true}});
    return data;
  }

  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/user/description-complaint/{id}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaints)
      },
    },
  })
  async getDescriptionComplaintUser(
    @param.path.string("id") userId: string,
  ): Promise<DescriptionComplaints[]> {
    const data = await this.descriptionComplaintRepository.find({
      where: {nationalCodeUserID: userId},
      fields: {codeDescriptionComplaint: true, titleDescriptionComplaint: true, complaintResult: true}
    });
    return data;
  }


  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/user/{id}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(Users)
      },
    },
  })
  async getUserByID(
    @param.path.string("id") userId: string,
  ): Promise<Users> {
    const data = await this.userRepository.findOne({
      where: {userID: userId},
      fields: {firstName: true, familyName: true, nationalCode: true, userID: true}
    });
    if (!data) throw new HttpErrors[400]("مشکل در ای دی وجود دارد");
    return data;
  }



  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/user/finaneial-payment/{id}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(FinaneialPayment)
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
