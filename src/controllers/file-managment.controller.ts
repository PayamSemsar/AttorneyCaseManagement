import {inject} from '@loopback/core';
import {
  get,
  HttpErrors,
  oas,
  param,
  Response,
  RestBindings
} from '@loopback/rest';
import path from 'path';
import {FILE_UPLOAD_SERVICE, STORAGE_DIRECTORY} from '../keys';
import {FileUploadHandler} from '../types';

export class FileManagment {

  constructor(
    @inject(FILE_UPLOAD_SERVICE) private handler: FileUploadHandler,
    @inject(STORAGE_DIRECTORY) private storageDirectory: string
  ) { }

  // upload file
  // @post('/upload', {
  //   responses: {
  //     200: {
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // async fileUpload(
  //   @requestBody.file()
  //   request: Request,
  //   @inject(RestBindings.Http.RESPONSE) response: Response,
  // ): Promise<object> {
  //   const data = await new Promise<object>((resolve, reject) => {
  //     this.handler(request, response, (err: any) => {
  //       if (err) reject(err);
  //       else {
  //         resolve(FileManagment.getFilesAndFields(request));
  //       }
  //     });
  //   })

  //   return data;
  // }

  // public static getFilesAndFields(request: Request) {
  //   const uploadedFiles = request.files;
  //   const mapper = (f: globalThis.Express.Multer.File) => ({
  //     originalname: f.originalname,
  //     filename: f.filename,
  //     mimetype: f.mimetype,
  //     path: f.path
  //   });
  //   let files = [];
  //   if (Array.isArray(uploadedFiles)) {
  //     files = uploadedFiles.map(mapper);
  //   } else {
  //     for (const filename in uploadedFiles) {
  //       files.push(...uploadedFiles[filename].map(mapper));
  //     }
  //   }

  //   return {files, fields: request.body};
  // }

  // download file
  @get('/download/{filename}')
  @oas.response.file()
  downloadFile(
    @param.path.string('filename') fileName: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    const file = this.validateFileName(fileName);
    response.download(file, fileName);
    return response;
  }
  validateFileName(fileName: string) {
    const resolved = path.resolve(this.storageDirectory, fileName)
    if (resolved.startsWith(this.storageDirectory)) return resolved;
    throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
  }
}
