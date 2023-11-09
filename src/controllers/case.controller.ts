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
    const findNationalCodeUser = await this.userRepository.findOne({
      where: {
        nationalCode: createCase.userNationalCode
      },
      fields: {
        nationalCode: true
      }
    });
    if (!findNationalCodeUser) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    const findCodeDescriptionComplaint = await this.descriptionComplaintRepository.findOne({
      where: {
        codeDescriptionComplaint: createCase.codeDescriptionComplaint
      },
      fields: {
        codeDescriptionComplaint: true
      }
    });
    if (!findCodeDescriptionComplaint) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    const findPetitionNumber = await this.caseRepository.findOne({
      where: {
        petitionNumber: createCase.petitionNumber
      },
      fields: {
        petitionNumber: true
      }
    });
    if (findPetitionNumber) throw new HttpErrors[400]("مقدار نکراری در اطلاعات وجود دارد");

    const findCaseNumber = await this.caseRepository.findOne({
      where: {
        caseNumber: createCase.caseNumber
      },
      fields: {
        caseNumber: true
      }
    });
    if (findCaseNumber) throw new HttpErrors[400]("مقدار نکراری در اطلاعات وجود دارد");

    const findBranchArchiveNumber = await this.caseRepository.findOne({
      where: {
        branchArchiveNumber: createCase.branchArchiveNumber
      },
      fields: {
        branchArchiveNumber: true
      }
    });
    if (findBranchArchiveNumber) throw new HttpErrors[400]("مقدار نکراری در اطلاعات وجود دارد");


    const timeNow = dateNow();
    if (!(timeNow < createCase.dateSet)) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    await this.caseRepository.create(createCase);
  }

  @get('/cases/{skip}/{limit}/{dcCode}')
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
  async find(
    @param.path.string("dcCode") dcCode: string,
    @param.path.number("skip") skip: number,
    @param.path.number("limit") limit: number,
  ): Promise<Case[]> {
    const data = await this.caseRepository.find({
      skip,
      limit,
      where: {
        codeDescriptionComplaint: dcCode
      },
      fields: {
        caseID: false
      }
    });
    return data;
  }
}
