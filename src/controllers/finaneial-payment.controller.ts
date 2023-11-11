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
import {FinaneialPayment} from '../models';
import {DescriptionComplaintRepository, FinaneialPaymentRepository, UserRepository} from '../repositories';
import {basicAuthorization} from '../services';
import {FileUploadHandler} from '../types';
var ObjectId = require('mongodb').ObjectId;

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


    // check file is it and type
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
    const findNationalCodeUser = await this.userRepository.findOne({
      where: {
        nationalCode: dataReq.fields.nationalCodeUser
      }
    });

    if (!findNationalCodeUser) {
      for (let i = 0; i < dataReq.files.length; i++) {
        fs.unlink(dataReq.files[i].path, (err) => {
          if (err) console.log(err);
        });
      }
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    };

    const findCodeDescriptionComplaint = await this.descriptionComplaintRepository.findOne({
      where: {
        codeDescriptionComplaint: dataReq.fields.codeDescriptionComplaint
      }
    });
    if (!findCodeDescriptionComplaint) {
      for (let i = 0; i < dataReq.files.length; i++) {
        fs.unlink(dataReq.files[i].path, (err) => {
          if (err) console.log(err);
        });
      }
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    };

    if (dataReq.fields.price < 1000) {
      for (let i = 0; i < dataReq.files.length; i++) {
        fs.unlink(dataReq.files[i].path, (err) => {
          if (err) console.log(err);
        });
      }
      throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    };

    // const timeNow = dateNow();
    // if (!(timeNow < dataReq.fields.date)) {
    //   for (let i = 0; i < dataReq.files.length; i++) {
    //     fs.unlink(dataReq.files[i].path, (err) => {
    //       if (err) console.log(err);
    //     });
    //   }
    //   throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    // };


    // file name
    dataReq.fields.fileImage = []
    for (let i = 0; i < dataReq.files.length; i++) {
      dataReq.fields.fileImage.push(dataReq.files[i].filename)
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


  // ----------------------------------------
  @get('/finaneial-payments-ncode/{skip}/{limiting}/{ncode}')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(FinaneialPayment, {
            exclude: ['finaneialPaymentID']
          }),
        },
      },
    },
  })
  async findByNCodeWithSkipAndLimitAll(
    @param.path.string('ncode') ncode: string,
    @param.path.number('skip') skip: number,
    @param.path.number('limiting') limit: string | number,
  ): Promise<FinaneialPayment[]> {
    const repository = await ((this.userRepository.dataSource.connector) as any).collection('User')
    if (limit == "all") {
      const data = await repository.aggregate([
        {
          $match: {
            nationalCode: ncode,
          }
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            familyName: 1,
            nationalCode: 1
          }
        },
        {
          $lookup: {
            from: "FinaneialPayment",
            let: {natCode: "$nationalCode"},
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {$eq: ['$nationalCodeUser', '$$natCode']},
                    ]
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                }
              }
            ],
            as: "finaneialPayments"
          }
        }
      ]).get()
      return data;
    }
    if (typeof limit != 'number') throw new HttpErrors[400](";/");
    const data = await repository.aggregate([
      {
        $match: {
          nationalCode: ncode,
        }
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          familyName: 1,
          nationalCode: 1
        }
      },
      {
        $lookup: {
          from: "FinaneialPayment",
          let: {natCode: "$nationalCode"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ['$nationalCodeUser', '$$natCode']},
                  ]
                }
              }
            },
            {
              $project: {
                _id: 0,
              }
            }
          ],
          as: "finaneialPayments"
        }
      }
    ]).get()

    return data;
  }

  @get('/finaneial-payments-dccode/{skip}/{limiting}/{dcCode}')
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
  async findByDcCodeWithSkipAndLimitAll(
    @param.path.string('dcCode') dcCode: string,
  ): Promise<FinaneialPayment[]> {
    const repository = await ((this.descriptionComplaintRepository.dataSource.connector) as any).collection('DescriptionComplaint')

    const data = await repository.aggregate([
      {
        $match: {
          codeDescriptionComplaint: dcCode,
        }
      },
      {
        $project: {
          codeDescriptionComplaint: 1,
          titleDescriptionComplaint: 1,
          complaintResult: 1,
          nationalCodeUser: 1
        }
      },
      {
        $lookup: {
          from: "FinaneialPayment",
          let: {dcCode: "$codeDescriptionComplaint"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ['$nationalCodeUser', '$$dcCode']},
                  ]
                }
              }
            },
            {
              $project: {
                _id: 0,
              }
            }
          ],
          as: "finaneialPayments"
        }
      }
    ]).get()
    return data;
  }

  @get('/finaneial-payments-time/{skip}/{limiting}/{start}/{end}')
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
    @param.path.number('skip') skip: number,
    @param.path.number('limiting') limit: string | number,
  ): Promise<FinaneialPayment[]> {
    if (limit == "all") {
      const data = await this.finaneialPaymentRepository.find({
        where: {
          date: {
            between: [start, end]
          }
        },
      });
      return data;
    }
    if (typeof limit != 'number') throw new HttpErrors[400](";/");
    const data = await this.finaneialPaymentRepository.find({
      skip,
      limit,
      where: {
        date: {
          between: [start, end]
        }
      },
    });
    return data;
  }
}
