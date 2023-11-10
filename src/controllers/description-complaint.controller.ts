import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
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
import {codeGenerator, dateNow} from '../helpers';
import {DescriptionComplaint} from '../models';
import {CaseRepository, DescriptionComplaintRepository, FinaneialPaymentRepository, UserRepository} from '../repositories';
import {basicAuthorization} from '../services';
var ObjectId = require('mongodb').ObjectId;

@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class DescriptionComplaintController {
  constructor(
    @repository(FinaneialPaymentRepository) public finaneialPaymentRepository: FinaneialPaymentRepository,
    @repository(DescriptionComplaintRepository) public descriptionComplaintRepository: DescriptionComplaintRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(CaseRepository) public caseRepository: CaseRepository,
  ) { }

  @post('/description-complaint/create')
  @response(200)
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DescriptionComplaint, {
            exclude: ['descriptionComplaintID', 'codeDescriptionComplaint', 'complaintResult'],
          }),
        },
      },
    })
    descriptionComplaint: DescriptionComplaint,
  ): Promise<void> {
    const nationalCodeUserFind = await this.userRepository.findOne({
      where: {
        nationalCode: descriptionComplaint.nationalCodeUser
      },
      fields: {
        nationalCode: true
      }
    })
    if (!nationalCodeUserFind) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    const timeNow = dateNow();
    if (timeNow > descriptionComplaint.datePresence) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    descriptionComplaint.codeDescriptionComplaint = codeGenerator()
    await this.descriptionComplaintRepository.create(descriptionComplaint);
  }

  @get('/description-complaints/{skip}/{limit}/{ncode}')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DescriptionComplaint, {
            exclude: ['datePresence', "descriptionComplaint"]
          }),
        },
      },
    },
  })
  async findWithSkipAndLimitByNCode(
    @param.path.string('ncode') ncode: string,
    @param.path.number("skip") skip: number,
    @param.path.number("limit") limit: number,
  ): Promise<DescriptionComplaint[]> {
    const data = await this.descriptionComplaintRepository.find({
      skip,
      limit,
      where: {
        nationalCodeUser: ncode
      },
      fields: {
        datePresence: false,
        descriptionComplaint: false,
      }
    })

    return data;
  }

  @get('/description-complaint/{code}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaint, {
          exclude: ['datePresence', 'descriptionComplaint', 'descriptionComplaintID']
        }),
      },
    },
  })
  async findBycode(
    @param.path.string('code') code: string
  ): Promise<DescriptionComplaint> {
    const data = await this.descriptionComplaintRepository.findOne({
      where: {
        codeDescriptionComplaint: code
      },
      fields: {
        nationalCodeUser: true,
        codeDescriptionComplaint: true,
        titleDescriptionComplaint: true,
        complaintResult: true
      }
    });
    if (!data) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    return data;
  }


  // ----------------------------------------------
  @get('/description-complaints/{start}/{end}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaint),
      },
    },
  })
  async findByTime(
    @param.path.number('start') start: number,
    @param.path.number('end') end: number,
  ): Promise<DescriptionComplaint[]> {
    const data = await this.descriptionComplaintRepository.find({
      where: {
        datePresence: {
          between: [start, end]
        }
      },
      // fields: {
      // }
    });
    return data;
  }

  @get('/description-complaints/{ncode}')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DescriptionComplaint),
        },
      },
    },
  })
  async findByNCode(
    @param.path.string('ncode') ncode: string,
  ): Promise<DescriptionComplaint[]> {
    const data = await this.descriptionComplaintRepository.find({
      where: {
        nationalCodeUser: ncode
      },
      // fields: {
      // }
    })

    return data;
  }
}
