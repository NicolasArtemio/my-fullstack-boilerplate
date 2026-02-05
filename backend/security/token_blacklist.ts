import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const TokenBlacklistSchema = z.object({
    redisHost: z.string().default('localhost').describe('Redis host address'),
    redisPort: z.number().default(6379).describe('Redis port'),
    tokenExpirySeconds: z.number().default(3600).describe('Default expiry for blacklisted tokens (should match JWT expiry)'),
});

const handler = async (args: z.infer<typeof TokenBlacklistSchema>): Promise<SkillResult> => {
    const { redisHost, redisPort, tokenExpirySeconds } = args;

    // We are generating a Service to handle logic and a Guard to enforce it
    const serviceCode = `import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async logout(token: string) {
    // Add token to blacklist with expiry
    // Key prefix: blacklist:token_signature
    await this.cacheManager.set(\`blacklist:\${token}\`, true, ${tokenExpirySeconds} * 1000); // cache-manager v5 uses milliseconds usually, check version
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const isListed = await this.cacheManager.get(\`blacklist:\${token}\`);
    return !!isListed;
  }
}
`;

    const guardCode = `import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (token) {
      const isBlacklisted = await this.authService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    
    // Continue to standard JWT signature check (usually handled by Passport strategy or subsequent guard)
    return true;
  }
}
`;

    const moduleSetup = `
// In your AuthModule or AppModule, ensure you import CacheModule with Redis store
/*
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: '${redisHost}',
      port: ${redisPort},
    }),
  ],
  providers: [AuthService, JwtBlacklistGuard],
  exports: [AuthService, JwtBlacklistGuard]
})
*/
`;

    return {
        success: true,
        data: {
            'auth.service.ts': serviceCode,
            'jwt-blacklist.guard.ts': guardCode,
            'setup-instructions.txt': moduleSetup
        },
        metadata: {
            integration: 'Redis',
            cacheManager: 'nestjs/cache-manager'
        }
    };
};

export const tokenBlacklistSkillDefinition: SkillDefinition<typeof TokenBlacklistSchema> = {
    name: 'token_blacklist',
    description: 'Generates logic for JWT revocation using Redis blacklist.',
    parameters: TokenBlacklistSchema,
    handler,
};
