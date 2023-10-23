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
import {FinaneialPayment} from '../models';
import {DescriptionComplaintRepository, FinaneialPaymentRepository, UserRepository} from '../repositories';
import {basicAuthorization} from '../services';

@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class FinaneialPaymentController {
  constructor(
    @repository(FinaneialPaymentRepository) public finaneialPaymentRepository: FinaneialPaymentRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(DescriptionComplaintRepository) public descriptionComplaintRepository: DescriptionComplaintRepository,
  ) { }

  @post('/finaneial-payment/create')
  @response(200)
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(FinaneialPayment, {
            exclude: ['finaneialPaymentID'],
          }),
        },
      },
    })
    createFinaneialPayment: FinaneialPayment,
  ): Promise<void> {
    const findNationalCodeUser = await this.userRepository.findOne({where: {nationalCode: createFinaneialPayment.userNationalCode}});
    if (!findNationalCodeUser) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    const findCodeDescriptionComplaint = await this.descriptionComplaintRepository.findOne({where: {codeDescriptionComplaint: createFinaneialPayment.codeDescriptionComplaint}});
    if (!findCodeDescriptionComplaint) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    const timeNow = dateNow();
    if (!(timeNow < createFinaneialPayment.date)) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    await this.finaneialPaymentRepository.create(createFinaneialPayment);
  }


  @get('/finaneial-payments')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(FinaneialPayment),
        },
      },
    },
  })
  async find(): Promise<FinaneialPayment[]> {
    const data = await this.finaneialPaymentRepository.find();
    return data;
  }

}
