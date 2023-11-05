import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {
  HttpErrors,
  Request,
  Response,
  RestBindings,
  get,
  getModelSchemaRef,
  param,
  post,
  requestBody,
  response
} from '@loopback/rest';
import fs from "fs";
import {RoleKeys} from '../enums';
import {dateNow} from '../helpers';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {FinaneialPayment} from '../models';
import {DescriptionComplaintRepository, FinaneialPaymentRepository, UserRepository} from '../repositories';
import {basicAuthorization} from '../services';
import {FileUploadHandler} from '../types';

@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class FinaneialPaymentController {
  constructor(
    @inject(FILE_UPLOAD_SERVICE) private handler: FileUploadHandler,
    @repository(FinaneialPaymentRepository) public finaneialPaymentRepository: FinaneialPaymentRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(DescriptionComplaintRepository) public descriptionComplaintRepository: DescriptionComplaintRepository,
  ) { }


  async creating(request: Request) {
    const dataReq: any = {files: request.files, fields: request.body}

    if (dataReq.files[0] == undefined) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    const fileTypes = ["jpg", "png"];
    for (let i = 0; i < dataReq.files.length; i++) {
      const extName = dataReq.files[i].originalname.split(".");
      if ((extName[(extName.length) - 1] !== fileTypes[0]) && (extName[(extName.length) - 1] !== fileTypes[1])) {
        for (let j = 0; j < dataReq.files.length; j++) {
          fs.unlink(dataReq.files[j].path, (err) => {
            if (err) console.log(err);
          });
        }
        throw new HttpErrors[400]("Error: You can Only Upload Images!!");
      }
    }

    const findNationalCodeUser = this.userRepository.findOne({where: {nationalCode: dataReq.fields.userNationalCode}});
    if (!findNationalCodeUser) {
      fs.unlink(dataReq.files[0].path, (err) => {
        if (err) console.log(err);
      });
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    };

    const findCodeDescriptionComplaint = this.descriptionComplaintRepository.findOne({where: {codeDescriptionComplaint: dataReq.fields.codeDescriptionComplaint}});
    if (!findCodeDescriptionComplaint) {
      fs.unlink(dataReq.files[0].path, (err) => {
        if (err) console.log(err);
      });
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    };

    if (dataReq.fields.price < 1000) {
      fs.unlink(dataReq.files[0].path, (err) => {
        if (err) console.log(err);
      });
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    };

    const timeNow = dateNow();
    if (!(timeNow < dataReq.fields.date)) {
      fs.unlink(dataReq.files[0].path, (err) => {
        if (err) console.log(err);
      });
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    };

    dataReq.fields.fileImage = []
    for (let i = 0; i < dataReq.files.length; i++) {
      const filename = dataReq.files[i].path.split("/");
      dataReq.fields.fileImage.push(filename[(filename.length) - 1])
    }

    await this.finaneialPaymentRepository.create(dataReq.fields);
  }

  @post('/finaneial-payment/create')
  @response(200)
  async create(
    @requestBody.file()
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<void> {
    await new Promise<object>((resolve, reject) => {
      this.handler(request, response, (err: any) => {
        if (err) reject(err);
        else {
          resolve(this.creating(request));
        }
      });
    })
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


  @get('/finaneial-payment/{start}/{end}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(FinaneialPayment),
      },
    },
  })
  async findByTime(
    @param.path.number('start') start: number,
    @param.path.number('end') end: number,
  ): Promise<FinaneialPayment[]> {
    const data = await this.finaneialPaymentRepository.find({
      where: {date: {between: [start, end]}},
      fields: {codeDescriptionComplaint: false, nationalCodeUserID: false}
    });
    return data;
  }
}
