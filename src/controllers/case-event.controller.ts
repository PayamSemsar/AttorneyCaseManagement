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
import {FILE_UPLOAD_SERVICE} from '../keys';
import {CaseEvent} from '../models';
import {CaseEventRepository, CaseRepository, DescriptionComplaintRepository} from '../repositories';
import {basicAuthorization} from '../services';
import {FileUploadHandler} from '../types';
@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class CaseEventController {
  constructor(
    @inject(FILE_UPLOAD_SERVICE) private handler: FileUploadHandler,
    @repository(CaseEventRepository) public caseEventRepository: CaseEventRepository,
    @repository(CaseRepository) public caseRepository: CaseRepository,
    @repository(DescriptionComplaintRepository) public descriptionComplaintRepository: DescriptionComplaintRepository,
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

    // const timeNow = dateNow();
    // if (!(timeNow < dataReq.fields.dateRecord)) {
    //   for (let i = 0; i < dataReq.files.length; i++) {
    //     fs.unlink(dataReq.files[i].path, (err) => {
    //       if (err) console.log(err);
    //     });
    //   }
    //   throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد")
    // };

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

    console.log("complaintResultUpdate", dataReq.fields.complaintResultUpdate);
    if (!dataReq.fields.complaintResultUpdate) throw new HttpErrors[400]("aaa");
    const updateComplaintResult = dataReq.fields.complaintResultUpdate;
    delete dataReq.fields.complaintResultUpdate;
    console.log("field", dataReq.fields);
    console.log("upComRes", updateComplaintResult);


    const createIsDone = await this.caseEventRepository.create(dataReq.fields);
    if (!createIsDone) throw new HttpErrors[400]("در ساخت وقایع پرونده به مشکل خوردیم")

    const caseEventRepositoryAggregate = await ((this.caseEventRepository.dataSource.connector) as any).collection('CaseEvent');
    const data = await caseEventRepositoryAggregate.aggregate([
      {
        $match: {
          codeCase: createIsDone.codeCase,
        }
      },
      {
        $project: {
          codeCase: 1,
        }
      },
      {
        $lookup: {
          from: "Case",
          let: {cCode: "$codeCase"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ['$codeCase', '$$cCode']},
                  ]
                }
              }
            },
            {
              $project: {
                codeCase: 1,
                codeDescriptionComplaint: 1,
              }
            }
          ],
          as: "Cases"
        }
      }
    ]).get()
    console.log(data[0]);

    await this.descriptionComplaintRepository.updateAll({
      codeDescriptionComplaint: data[0].Cases.codeDescriptionComplaint
    },
      {
        complaintResult: updateComplaintResult
      })
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


  @get('/case-events/{skip}/{limit}/{cCode}')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CaseEvent, {
            exclude: ['caseEventID']
          }),
        },
      },
    },
  })
  async find(
    @param.path.number('skip') skip: number,
    @param.path.number('limit') limit: number,
    @param.path.string('cCode') cCode: string,
  ): Promise<CaseEvent[]> {
    const data = await this.caseEventRepository.find({
      skip,
      limit,
      where: {
        codeCase: cCode
      },
      fields: {
        caseEventID: false,
      }
    });
    return data;
  }



  // ---------------------------------------
  @get('/case-events-time/{start}/{end}')
  @response(200, {
    content: {
      'application/json': {
        type: "array",
        schema: getModelSchemaRef(CaseEvent),
      },
    },
  })
  async findByTime(
    @param.path.number('start') start: number,
    @param.path.number('end') end: number,
    // @param.path.number('skip') skip: number,
    // @param.path.string('limiting') limit: string | number,
  ): Promise<CaseEvent[]> {
    const data = await this.caseEventRepository.find({
      where: {
        dateDo: {
          between: [start, end]
        }
      },
    });
    return data;

    // limit = Number(limit)
    // if (isNaN(limit)) throw new HttpErrors[400]("مفداریر در پارامتر صحیح نمی باشد");

    // const data = await this.caseEventRepository.find({
    //   skip,
    //   limit,
    //   where: {
    //     dateDo: {
    //       between: [start, end]
    //     }
    //   },
    // });
    // return data;
  }
}
