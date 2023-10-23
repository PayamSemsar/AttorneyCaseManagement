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
import {ReminderCustom} from '../models';
import {ReminderCustomRepository} from '../repositories';
import {basicAuthorization} from '../services';

@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class ReminderCustomController {
  constructor(
    @repository(ReminderCustomRepository)
    public reminderCustomRepository: ReminderCustomRepository,
  ) { }

  @post('/reminder-custom/create')
  @response(200)
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ReminderCustom, {
            exclude: ['reminderCustomID'],
          }),
        },
      },
    })
    createReminderCustom: ReminderCustom,
  ): Promise<void> {
    const timeNow = dateNow();
    if (!(timeNow < createReminderCustom.reminderCustomDate)) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    await this.reminderCustomRepository.create(createReminderCustom);
  }

  @get('/reminder-customs')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ReminderCustom,
            {
              exclude: ['reminderCustomID']
            }
          ),
        },
      },
    },
  })
  async find(): Promise<ReminderCustom[]> {
    const data = await this.reminderCustomRepository.find({fields: {reminderCustomID: false}});
    return data;
  }


}
