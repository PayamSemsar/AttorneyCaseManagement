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
import {CaseEvent} from '../models';
import {CaseEventRepository, CaseRepository} from '../repositories';
import {basicAuthorization} from '../services';
import {FileUploadHandler} from '../types';
@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class CaseEventController {
  constructor(
    @inject(FILE_UPLOAD_SERVICE) private handler: FileUploadHandler,
    @repository(CaseEventRepository) public caseEventRepository: CaseEventRepository,
    @repository(CaseRepository) public caseRepository: CaseRepository,
  ) { }

  async creating(request: Request) {
    const dataReq: any = {files: request.files, fields: request.body}


    // check img is it and type
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


    // check value
    const findCodeCase = await this.caseRepository.findOne({
      where: {
        codeCase: dataReq.fields.codeCase
      }
    });
    if (!findCodeCase) {
      for (let i = 0; i < dataReq.files.length; i++) {
        fs.unlink(dataReq.files[i].path, (err) => {
          if (err) console.log(err);
        });
      }
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد")
    };

    const timeNow = dateNow();
    if (!(timeNow < dataReq.fields.dateRecord)) {
      for (let i = 0; i < dataReq.files.length; i++) {
        fs.unlink(dataReq.files[i].path, (err) => {
          if (err) console.log(err);
        });
      }
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد")
    };

    if (dataReq.fields.dateRecord > dataReq.fields.dateDo) {
      for (let i = 0; i < dataReq.files.length; i++) {
        fs.unlink(dataReq.files[i].path, (err) => {
          if (err) console.log(err);
        });
      }
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد")
    };

    if (!dataReq.fields.descriptionEvent) {
      for (let i = 0; i < dataReq.files.length; i++) {
        fs.unlink(dataReq.files[i].path, (err) => {
          if (err) console.log(err);
        });
      }
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد")
    };


    // name file
    dataReq.fields.fileImage = []
    for (let i = 0; i < dataReq.files.length; i++) {
      dataReq.fields.fileImage.push(dataReq.files[i].filename)
    }

    await this.caseEventRepository.create(dataReq.fields);
  }


  @post('/case-event/create')
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


  @get('/case-event/{start}/{end}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(CaseEvent),
      },
    },
  })
  async findByTime(
    @param.path.number('start') start: number,
    @param.path.number('end') end: number,
  ): Promise<CaseEvent[]> {
    const data = await this.caseEventRepository.find({where: {dateDo: {between: [start, end]}}, fields: {caseEventID: false}});
    return data;
  }
}
