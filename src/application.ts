import {AuthenticationComponent} from '@loopback/authentication';
import {AuthorizationComponent} from '@loopback/authorization';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {JWTAuthenticationComponent, SECURITY_SCHEME_SPEC} from './jwt-authentication';
import {MySequence} from './sequence';
require('dotenv').config()

export class AttorneyCaseManagementApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);
    this.addSecuritySpec();

    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);

    this.component(AuthorizationComponent)


    this.sequence(MySequence);
    this.static('/', path.join(__dirname, '../public'));
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);
    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }



  addSecuritySpec(): void {
    this.api({
      openapi: '3.0.0',
      info: {
        title: 'access-control-example',
        version: require('.././package.json').version,
      },
      paths: {},
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      security: [
        {
          jwt: [],
        },
      ],
      servers: [{url: '/'}],
    });
  }
}
export {ApplicationConfig};

