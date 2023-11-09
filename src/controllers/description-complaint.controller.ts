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
import {dateNow} from '../helpers';
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
    const nationalCodeUserFind = await this.userRepository.findOne({where: {userID: descriptionComplaint.nationalCodeUserID}})
    if (!nationalCodeUserFind) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    const timeNow = dateNow();
    if (timeNow > descriptionComplaint.datePresence) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    await this.descriptionComplaintRepository.create(descriptionComplaint);
  }

  @get('/description-complaints/{skip}/{limit}/{uid}')
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
  async find(
    @param.path.string('uid') id: string,
    @param.path.number("skip") skip: number,
    @param.path.number("limit") limit: number,
  ): Promise<DescriptionComplaint[]> {
    const USERID = new ObjectId(id)
    const repository = await ((this.descriptionComplaintRepository.dataSource.connector) as any).collection('DescriptionComplaint')
    const data = await repository.aggregate([
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $match: {
          nationalCodeUserID: USERID,
        }
      },
      {
        $project: {
          _id: 1,
          // nationalCodeUserID: 1,
          codeDescriptionComplaint: 1,
          titleDescriptionComplaint: 1,
          complaintResult: 1
        }
      },
      // {
      //   $lookup: {
      //     from: "User",
      //     let: {userId: "$nationalCodeUserID"},
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $and: [
      //               {$eq: ['$_id', '$$userId']},
      //             ]
      //           }
      //         }
      //       },
      //       {
      //         $project: {
      //           _id: 1,
      //           nationalCode: 1,
      //         }
      //       }
      //     ],
      //     as: "users"
      //   }
      // }
    ]).get()

    return data;
  }

  @get('/description-complaint/{code}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaint),
      },
    },
  })
  async findBycode(
    @param.path.string('code') code: string
  ): Promise<DescriptionComplaint | null> {
    const data = await this.descriptionComplaintRepository.findOne({where: {codeDescriptionComplaint: code}, fields: {codeDescriptionComplaint: true, titleDescriptionComplaint: true, complaintResult: true}});
    return data;
  }

  @get('/description-complaint/{start}/{end}')
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
    const data = await this.descriptionComplaintRepository.find({where: {datePresence: {between: [start, end]}}, fields: {codeDescriptionComplaint: true, titleDescriptionComplaint: true, complaintResult: true}});
    return data;
  }

}
