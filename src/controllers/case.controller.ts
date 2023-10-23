import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {
  repository
} from '@loopback/repository';
import {
  HttpErrors,
  get,
  getModelSchemaRef,
  post,
  requestBody,
  response
} from '@loopback/rest';
import {RoleKeys} from '../enums';
import {dateNow} from '../helpers';
import {Case} from '../models';
import {CaseRepository, DescriptionComplaintRepository, UserRepository} from '../repositories';
import {basicAuthorization} from '../services';


@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class CaseController {
  constructor(
    @repository(CaseRepository) public caseRepository: CaseRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(DescriptionComplaintRepository) public descriptionComplaintRepository: DescriptionComplaintRepository,
  ) { }

  @post('/case/create')
  @response(200)
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Case, {
            exclude: ['caseID', 'codeCase'],
          }),
        },
      },
    })
    createCase: Case,
  ): Promise<void> {
    const findNationalCodeUser = this.userRepository.findOne({where: {nationalCode: createCase.userNationalCode}});
    if (!findNationalCodeUser) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    const findCodeDescriptionComplaint = this.descriptionComplaintRepository.findOne({where: {codeDescriptionComplaint: createCase.codeDescriptionComplaint}});
    if (!findCodeDescriptionComplaint) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    const timeNow = dateNow();
    if (!(timeNow < createCase.dateSet)) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    await this.caseRepository.create(createCase);
  }

  @get('/cases')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Case),
        },
      },
    },
  })
  async find(): Promise<Case[]> {
    const data = await this.caseRepository.find();
    return data;
  }


  // @get('/cases/{id}')
  // @response(200, {
  //   content: {
  //     'application/json': {
  //       schema: getModelSchemaRef(Case),
  //     },
  //   },
  // })
  // async findById(
  //   @param.path.string('id') id: string,
  // ): Promise<Case> {
  //   const data = await this.caseRepository.findById(id);
  //   return data;
  // }


}
