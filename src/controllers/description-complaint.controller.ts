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
import {Case, DescriptionComplaint} from '../models';
import {CaseRepository, DescriptionComplaintRepository, UserRepository} from '../repositories';
import {basicAuthorization} from '../services';


@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class DescriptionComplaintController {
  constructor(
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
    const nationalCodeUserFind = await this.userRepository.findOne({where: {nationalCode: descriptionComplaint.nationalCodeUser}, fields: {nationalCode: true}})
    if (!nationalCodeUserFind) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    const timeNow = dateNow();
    if (!(timeNow < descriptionComplaint.datePresence)) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    await this.descriptionComplaintRepository.create(descriptionComplaint);
  }

  @get('/description-complaints')
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
  async find(): Promise<DescriptionComplaint[]> {
    return this.descriptionComplaintRepository.find();
  }



  @get('/description-complaint/{code}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(Case),
      },
    },
  })
  async findBycode(
    @param.path.string('code') code: string
  ): Promise<Case[]> {
    const findBycode = this.descriptionComplaintRepository.findOne({where: {codeDescriptionComplaint: code}});
    if (!findBycode) throw new HttpErrors[400]("مقدار اشتباهی وارد کردید");
    const data = await this.caseRepository.find({where: {codeDescriptionComplaint: code}});
    return data;
  }

}
