import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const CacheManagerSchema = z.object({
    cacheType: z.enum(['redis', 'memory']).default('redis').describe('Type of cache store'),
    defaultTTL: z.number().default(3600).describe('Default TTL in seconds'),
    keyPrefix: z.string().default('app').describe('Prefix for cache keys'),
    generateDecorator: z.boolean().default(true).describe('Generate @Cacheable decorator'),
    generateInterceptor: z.boolean().default(true).describe('Generate CacheInterceptor'),
});

const handler = async (args: z.infer<typeof CacheManagerSchema>): Promise<SkillResult> => {
    const { cacheType, defaultTTL, keyPrefix, generateDecorator, generateInterceptor } = args;

    const files: Record<string, string> = {};

    // Cache Module
    files['cache.module.ts'] = `import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
${cacheType === 'redis' ? `import * as redisStore from 'cache-manager-redis-store';` : ''}
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      ${cacheType === 'redis' ? `store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,` : ''}
      ttl: ${defaultTTL},
      max: 100, // max items in cache
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}
`;

    // Cache Service
    files['cache.service.ts'] = `import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly prefix = '${keyPrefix}';

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private buildKey(key: string): string {
    return \`\${this.prefix}:\${key}\`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(this.buildKey(key));
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(this.buildKey(key), value, ttl || ${defaultTTL});
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(this.buildKey(key));
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * Cache-aside pattern: Get from cache or fetch and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  /**
   * Invalidate multiple keys by pattern (useful for entity updates)
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    // Note: Pattern invalidation requires Redis with SCAN command
    // For memory cache, you'd need to track keys manually
    console.log(\`Invalidating keys matching: \${this.prefix}:\${pattern}\`);
  }
}
`;

    // Cacheable Decorator
    if (generateDecorator) {
        files['cacheable.decorator.ts'] = `import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

export interface CacheableOptions {
  key?: string;
  ttl?: number;
}

/**
 * @Cacheable decorator for automatic caching
 * Use with CacheInterceptor
 * 
 * @example
 * @Cacheable({ key: 'users:all', ttl: 300 })
 * async findAll() { ... }
 */
export const Cacheable = (options: CacheableOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, options.key || \`\${target.constructor.name}:\${propertyKey}\`)(target, propertyKey, descriptor);
    if (options.ttl) {
      SetMetadata(CACHE_TTL_METADATA, options.ttl)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};
`;
    }

    // Cache Interceptor
    if (generateInterceptor) {
        files['cache.interceptor.ts'] = `import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from './cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cacheable.decorator';

@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());
    const request = context.switchToHttp().getRequest();
    
    // Build dynamic key with query params if needed
    const dynamicKey = request.query.id 
      ? \`\${cacheKey}:\${request.query.id}\`
      : cacheKey;

    const cachedResponse = await this.cacheService.get(dynamicKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(dynamicKey, response, ttl);
      }),
    );
  }
}
`;
    }

    // Usage Example
    files['cache.example.ts'] = `// Example usage in a service or controller
import { Cacheable } from './cacheable.decorator';
import { UseInterceptors } from '@nestjs/common';
import { CustomCacheInterceptor } from './cache.interceptor';

@Controller('products')
@UseInterceptors(CustomCacheInterceptor)
export class ProductsController {
  
  @Get()
  @Cacheable({ key: 'products:all', ttl: 300 }) // 5 minutes
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @Cacheable({ key: 'products:single', ttl: 600 }) // 10 minutes
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    // Invalidate list cache
    await this.cacheService.del('products:all');
    return product;
  }
}
`;

    return {
        success: true,
        data: files,
        metadata: {
            cacheType,
            defaultTTL,
            generatedFiles: Object.keys(files),
        },
    };
};

export const cacheManagerSkillDefinition: SkillDefinition<typeof CacheManagerSchema> = {
    name: 'cache_manager',
    description: 'Generates NestJS caching infrastructure with Redis/Memory support, decorators, and interceptors.',
    parameters: CacheManagerSchema,
    handler,
};
