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
import {codeGenerator} from '../helpers';
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

    const findCodeDescriptionComplaint = await this.descriptionComplaintRepository.findOne({
      where: {
        codeDescriptionComplaint: createCase.codeDescriptionComplaint
      },
      fields: {
        codeDescriptionComplaint: true
      }
    });
    if (!findCodeDescriptionComplaint) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    const findCaseAgain = await this.caseRepository.findOne({
      where: {
        codeDescriptionComplaint: createCase.codeDescriptionComplaint
      },
      fields: {
        codeDescriptionComplaint: true,
      }
    });
    if (findCaseAgain) throw new HttpErrors[400]("در حال حاضر این شکایت دارای پرونده است");

    const findNationalCodeUser = await this.userRepository.findOne({
      where: {
        nationalCode: createCase.userNationalCode
      },
      fields: {
        nationalCode: true
      }
    });
    if (!findNationalCodeUser) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

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


    // const timeNow = dateNow();
    // if (!(timeNow < createCase.dateSet)) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    createCase.codeCase = codeGenerator()
    await this.caseRepository.create(createCase);
  }

  @get('/cases/{skip}/{limit}/{dcCode}')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Case, {
            exclude: ['caseID']
          }),
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

  @get('/case/{cCode}')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Case, {
            exclude: ['caseID']
          }),
        },
      },
    },
  })
  async findByCodeCase(
    @param.path.string("cCode") cCode: string,
  ): Promise<Case> {
    const data = await this.caseRepository.findOne({
      where: {
        codeCase: cCode
      },
      fields: {
        caseID: false
      }
    });
    if (!data) throw new HttpErrors[400]("همچین کد پرونده ای وجود ندارد");
    return data;
  }


  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/cases-code/{code}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(Case, {
          exclude: ['accuseds', 'branchArchiveNumber', 'caseID', 'caseNumber', 'codeDescriptionComplaint', 'dateSet', 'petitionNumber', 'userNationalCode']
        })
      },
    },
  })
  async getUserByCode(
    @param.path.string("code") code: string,
  ): Promise<Case[]> {
    const data = await this.caseRepository.find({
      where: {
        codeCase: {regexp: code},
      },
      fields: {
        codeCase: true
      }
    });
    return data;
  }



  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/case-code-and-event/{cCode}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(Case)
      },
    },
  })
  async getUserByCodeReturnCaseevent(
    @param.path.string("cCode") cCode: string,
  ): Promise<Case[]> {
    const repository = await ((this.caseRepository.dataSource.connector) as any).collection('Case')

    const data = await repository.aggregate([
      {
        $match: {
          codeCase: cCode
        }
      },
      {
        $project: {
          _id: 0,
        }
      },
      {
        $lookup: {
          from: "CaseEvent",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ['$codeCase', cCode]},
                  ]
                },
              }
            },
            {
              $project: {
                _id: 0
              }
            }
          ],
          as: "CaseEvents"
        }
      }
    ]).get()

    return data[0];
  }
}
