import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
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
import {dateNow} from '../helpers';
import {DescriptionComplaint, FinaneialPayment} from '../models';
import {DescriptionComplaints} from '../models/description-complaints.model';
import {CaseRepository, DescriptionComplaintRepository, FinaneialPaymentRepository, UserRepository} from '../repositories';
import {basicAuthorization} from '../services';


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

  @get('/description-complaints')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DescriptionComplaints),
        },
      },
    },
  })
  async find(): Promise<DescriptionComplaints[]> {
    const data = await this.descriptionComplaintRepository.find({
      include: [
        {
          relation: 'user',
          scope: {
            fields: {
              userID: true,
              nationalCode: true,
            },
          }
        }
      ], fields: {
        nationalCodeUserID: true,
        codeDescriptionComplaint: true,
        titleDescriptionComplaint: true,
        complaintResult: true
      }
    });

    // const col = await ((this.descriptionComplaintRepository.dataSource.connector) as any).collection('DescriptionComplaint')
    // const aa = await col.aggregate([{
    //   "$lookup": {
    //     "from": "User",
    //     "localField": "nationalCodeUserID",
    //     "foreignField": "_id",
    //     "as": "users"
    //   }
    // }]).get()
    // console.log(aa);


    return data;
  }

  @get('/description-complaint/{code}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaints),
      },
    },
  })
  async findBycode(
    @param.path.string('code') code: string
  ): Promise<DescriptionComplaints> {
    const data = await this.descriptionComplaintRepository.findOne({where: {codeDescriptionComplaint: code}, fields: {codeDescriptionComplaint: true, titleDescriptionComplaint: true, complaintResult: true}});
    if (!data) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    return data;
  }

  @get('/description-complaint/finaneial-payments/{code}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(FinaneialPayment),
      },
    },
  })
  async findFinaneialPaymentBycode(
    @param.path.string('code') code: string
  ): Promise<FinaneialPayment[]> {
    const data = await this.finaneialPaymentRepository.find({where: {codeDescriptionComplaint: code}, fields: {codeDescriptionComplaint: false, nationalCodeUserID: false}});
    return data;
  }

  @get('/description-complaint/{start}/{end}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaints),
      },
    },
  })
  async findByTime(
    @param.path.number('start') start: number,
    @param.path.number('end') end: number,
  ): Promise<DescriptionComplaints[]> {
    const data = await this.descriptionComplaintRepository.find({where: {datePresence: {between: [start, end]}}, fields: {codeDescriptionComplaint: true, titleDescriptionComplaint: true, complaintResult: true}});
    return data;
  }

}
