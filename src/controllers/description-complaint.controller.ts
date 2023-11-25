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
import {DescriptionComplaint} from '../models';
import {CaseRepository, DescriptionComplaintRepository, FinaneialPaymentRepository, UserRepository} from '../repositories';
import {basicAuthorization} from '../services';
var ObjectId = require('mongodb').ObjectId;

@authenticate('token')
@authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
export class DescriptionComplaintController {
  constructor(
    @repository(FinaneialPaymentRepository) public finaneialPaymentRepository: FinaneialPaymentRepository,
    @repository(DescriptionComplaintRepository) public descriptionComplaintRepository: DescriptionComplaintRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(CaseRepository) public caseRepository: CaseRepository,
  ) { }

  @post('/description-complaint/create')
  @response(200)
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DescriptionComplaint, {
            exclude: ['descriptionComplaintID', 'codeDescriptionComplaint', 'complaintResult'],
          }),
        },
      },
    })
    descriptionComplaint: DescriptionComplaint,
  ): Promise<void> {
    const nationalCodeUserFind = await this.userRepository.findOne({
      where: {
        nationalCode: descriptionComplaint.nationalCodeUser
      },
      fields: {
        nationalCode: true
      }
    })
    if (!nationalCodeUserFind) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    // const timeNow = dateNow();
    // if (timeNow > descriptionComplaint.datePresence) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");

    descriptionComplaint.codeDescriptionComplaint = codeGenerator()
    await this.descriptionComplaintRepository.create(descriptionComplaint);
  }

  @get('/description-complaints/{skip}/{limit}/{ncode}')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DescriptionComplaint, {
            exclude: ['datePresence', "descriptionComplaint"]
          }),
        },
      },
    },
  })
  async findWithSkipAndLimitByNCode(
    @param.path.string('ncode') ncode: string,
    @param.path.number("skip") skip: number,
    @param.path.number("limit") limit: number,
  ): Promise<DescriptionComplaint[]> {
    const data = await this.descriptionComplaintRepository.find({
      skip,
      limit,
      where: {
        nationalCodeUser: ncode
      },
      fields: {
        datePresence: false,
        descriptionComplaint: false,
      }
    })

    return data;
  }

  @get('/description-complaint/{code}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaint, {
          exclude: ['datePresence', 'descriptionComplaint', 'descriptionComplaintID']
        }),
      },
    },
  })
  async findBycode(
    @param.path.string('code') code: string
  ): Promise<DescriptionComplaint> {
    const data = await this.descriptionComplaintRepository.findOne({
      where: {
        codeDescriptionComplaint: code
      },
      fields: {
        nationalCodeUser: true,
        codeDescriptionComplaint: true,
        titleDescriptionComplaint: true,
        complaintResult: true
      }
    });
    if (!data) throw new HttpErrors[400]("مشکل در اطلاعات وجود دارد");
    return data;
  }

  // ----------------------------------------------

  @get('/description-complaint-code/{dcCode}')
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaint, {
          exclude: ['descriptionComplaintID']
        }),
      },
    },
  })
  async findByCode(
    @param.path.string('dcCode') dcCode: string
  ): Promise<DescriptionComplaint> {
    const repository = await ((this.descriptionComplaintRepository.dataSource.connector) as any).collection('DescriptionComplaint')

    const data = await repository.aggregate([
      {
        $match: {
          codeDescriptionComplaint: dcCode,
        }
      },
      {
        $project: {
          _id: 0,
        }
      },
      {
        $lookup: {
          from: "User",
          let: {nCode: "$nationalCodeUser"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ['$nationalCode', '$$nCode']},
                  ]
                },
              }
            },
            {
              $project: {
                firstName: 1,
                familyName: 1,
                nationalCode: 1,
              }
            }
          ],
          as: "User"
        }
      }
    ]).get()
    return data[0];
  }

  @get('/description-complaints-time/{start}/{end}')
  @response(200, {
    content: {
      'application/json': {
        type: "array",
        schema: getModelSchemaRef(DescriptionComplaint),
      },
    },
  })
  async findByTime(
    @param.path.number('start') start: number,
    @param.path.number('end') end: number,
  ): Promise<DescriptionComplaint[]> {
    const repository = await ((this.descriptionComplaintRepository.dataSource.connector) as any).collection('DescriptionComplaint')

    let where: any = {};

    if (start && end) {
      where = {
        $gte: start,
        $lte: end
      };
    } else if (start) {
      where = {
        $gte: start,
      };
    } else if (end) {
      where = {
        $lte: end,
      };
    }

    const data = await repository.aggregate([
      {
        $match: {
          datePresence: {
            where
          },
        }
      },
      {
        $project: {
          _id: 0,
        }
      },
      {
        $lookup: {
          from: "User",
          let: {nCode: "$nationalCodeUser"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ['$nationalCode', '$$nCode']},
                  ]
                },
              }
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                familyName: 1,
                nationalCode: 1,
              }
            }
          ],
          as: "users"
        }
      }
    ]).get()
    return data;

    // limit = Number(limit)
    // if (isNaN(limit)) throw new HttpErrors[400]("مفداریر در پارامتر صحیح نمی باشد");

    // const data = await repository.aggregate([
    //   {
    //     $match: {
    //       datePresence: {
    //         $gte: start,
    //         $lte: end
    //       },
    //     }
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //     }
    //   },
    //   {
    //     $skip: skip,
    //   },
    //   {
    //     $limit: limit,
    //   },
    //   {
    //     $lookup: {
    //       from: "User",
    //       let: {nCode: "$nationalCodeUser"},
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 {$eq: ['$nationalCode', '$$nCode']},
    //               ]
    //             },
    //           }
    //         },
    //         {
    //           $project: {
    //             _id: 1,
    //             firstName: 1,
    //             familyName: 1,
    //             nationalCode: 1,
    //           }
    //         }
    //       ],
    //       as: "users"
    //     }
    //   }
    // ]).get()
    // return data;
  }

  @get('/description-complaints-ncode/{ncode}')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          items: getModelSchemaRef(DescriptionComplaint),
        },
      },
    },
  })
  async findByNCodeWithSkipAndLimitAll(
    @param.path.string('ncode') ncode: string,
    // @param.path.number('skip') skip: number,
    // @param.path.string('limiting') limit: string | number,
  ): Promise<DescriptionComplaint> {

    const repository = await ((this.userRepository.dataSource.connector) as any).collection('User')
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
          nationalCode: 1,
        }
      },
      {
        $lookup: {
          from: "DescriptionComplaint",
          let: {nCode: "$nationalCode"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ['$nationalCodeUser', '$$nCode']},
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
          as: "descriptionComplaints"
        }
      }
    ]).get()
    return data[0];

    // limit = Number(limit)
    // if (isNaN(limit)) throw new HttpErrors[400]("مفداریر در پارامتر صحیح نمی باشد");

    // const data = await repository.aggregate([
    //   {
    //     $match: {
    //       nationalCode: ncode,
    //     }
    //   },
    //   {
    //     $skip: skip,
    //   },
    //   {
    //     $limit: limit,
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       firstName: 1,
    //       familyName: 1,
    //       nationalCode: 1,
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: "DescriptionComplaint",
    //       let: {nCode: "$nationalCode"},
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 {$eq: ['$nationalCodeUser', '$$nCode']},
    //               ]
    //             }
    //           }
    //         },
    //         {
    //           $project: {
    //             _id: 0,
    //           }
    //         }
    //       ],
    //       as: "descriptionComplaints"
    //     }
    //   }
    // ]).get()


    // return data[0];
  }


  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/description-complaints-code/{code}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaint, {
          exclude: ['complaintResult', 'datePresence', 'descriptionComplaint', 'descriptionComplaintID', 'nationalCodeUser', 'titleDescriptionComplaint']
        })
      },
    },
  })
  async getDescriptionComplaintByCode(
    @param.path.string("code") code: string,
  ): Promise<DescriptionComplaint[]> {
    const data = await this.descriptionComplaintRepository.find({
      where: {
        codeDescriptionComplaint: {regexp: code},
      },
      fields: {
        codeDescriptionComplaint: true
      }
    });
    return data;
  }


  @authenticate('token')
  @authorize({allowedRoles: [RoleKeys.Admin], voters: [basicAuthorization]})
  @get("/description-complaints-title/{title}")
  @response(200, {
    content: {
      'application/json': {
        schema: getModelSchemaRef(DescriptionComplaint, {
          exclude: ['complaintResult', 'datePresence', 'descriptionComplaint', 'descriptionComplaintID', 'nationalCodeUser', 'codeDescriptionComplaint']
        })
      },
    },
  })
  async getDescriptionComplaintByTitle(
    @param.path.string("title") title: string,
  ): Promise<DescriptionComplaint[]> {
    const data = await this.descriptionComplaintRepository.find({
      where: {
        titleDescriptionComplaint: {regexp: title},
      },
      fields: {
        titleDescriptionComplaint: true
      }
    });
    return data;
  }
}
