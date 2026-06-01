import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UserInfoProvider } from '../providers/user-info.provider';
import { firstValueFrom } from 'rxjs';
import { MICROSERVICE } from '../constants/microservice.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(MICROSERVICE.AUTH) private readonly authClient: ClientProxy,
    private readonly userInfoProvider: UserInfoProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers;
    const authToken = authHeader['authorization'];
    if (!authToken) return false;
      const userInfo = await firstValueFrom(this.authClient.send('validate_token', authHeader));

      if (!userInfo) return false;

      this.userInfoProvider.setUser(userInfo);
      return true;
  }
}
