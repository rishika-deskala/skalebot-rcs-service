import { Module, Global } from '@nestjs/common';
import { MicroservicesModule } from './microservices/microservices.module';
import { UserInfoProvider } from './providers/user-info.provider';
import { MetaHelperService } from './meta.helper.service';
import { MetaApiService } from './metaHelperService/meta.api.service';
import { MetaCatalogHelperService } from './metaHelperService/meta.catalog.helper';

@Global()
@Module({
  imports: [
    MicroservicesModule,
  ],
  providers: [
    UserInfoProvider,
    MetaHelperService,
    MetaApiService,
    MetaCatalogHelperService,
  ],
  exports: [
    UserInfoProvider,
    MicroservicesModule,
    MetaHelperService,
    MetaCatalogHelperService,
  ],
})
export class SharedModule { }
