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
import {CaseEvent} from '../models';
import {CaseEventRepository, CaseRepository} from '../repositories';
import {basicAuthorization} from '../services';

@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class CaseEventController {
  constructor(
    @repository(CaseEventRepository) public caseEventRepository: CaseEventRepository,
    @repository(CaseRepository) public caseRepository: CaseRepository,
  ) { }


  @post('/case-event/create')
  @response(200)
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CaseEvent, {
            exclude: ['caseEventID'],
          }),
        },
      },
    })
    createCaseEvent: CaseEvent,
  ): Promise<void> {
    const findCodeCase = await this.caseRepository.findOne({where: {codeCase: createCaseEvent.codeCase}});
    if (!findCodeCase) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    const timeNow = dateNow();
    if (!(timeNow < createCaseEvent.dateRecord)) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    if (createCaseEvent.dateRecord > createCaseEvent.dateDo) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    await this.caseEventRepository.create(createCaseEvent);
  }

  @get('/case-events')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CaseEvent),
        },
      },
    },
  })
  async find(): Promise<CaseEvent[]> {
    const data = await this.caseEventRepository.find();
    return data;
  }

  // @get('/case-event/{id}')
  // @response(200, {
  //   content: {
  //     'application/json': {
  //       schema: getModelSchemaRef(CaseEvent),
  //     },
  //   },
  // })
  // async findById(
  //   @param.path.string('id') id: string,
  // ): Promise<CaseEvent> {
  //   const data = await this.caseEventRepository.findById(id);
  //   return data;
  // }

}
