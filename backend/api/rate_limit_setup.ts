import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const RateLimitSetupSchema = z.object({
    ttl: z.number().default(60).describe('Time to live (seconds)'),
    limit: z.number().default(10).describe('Max number of requests within TTL'),
});

const handler = async (args: z.infer<typeof RateLimitSetupSchema>): Promise<SkillResult> => {
    const { ttl, limit } = args;

    const code = `import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: ${ttl},
      limit: ${limit},
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class RateLimiterModule {}

// To override on specific controllers/methods:
// @SkipThrottle()
// @Throttle({ default: { limit: 3, ttl: 60 } })
`;

    return {
        success: true,
        data: code,
        metadata: {
            dependencies: ['@nestjs/throttler'],
            defaultConfig: { ttl, limit }
        }
    };
};

export const rateLimitSetupSkillDefinition: SkillDefinition<typeof RateLimitSetupSchema> = {
    name: 'rate_limit_setup',
    description: 'Generates RateLimiterModule configuration using @nestjs/throttler.',
    parameters: RateLimitSetupSchema,
    handler,
};
