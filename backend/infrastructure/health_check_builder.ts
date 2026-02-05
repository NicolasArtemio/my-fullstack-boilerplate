import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const HealthCheckBuilderSchema = z.object({
    checkDatabase: z.boolean().default(true).describe('Include database ping check (TypeORM)'),
    checkMemory: z.boolean().default(true).describe('Include memory usage check'),
    memoryThresholdMB: z.number().default(150).describe('Memory threshold in MB for health warning'),
});

const handler = async (args: z.infer<typeof HealthCheckBuilderSchema>): Promise<SkillResult> => {
    const { checkDatabase, checkMemory, memoryThresholdMB } = args;

    const imports = [
        `import { Controller, Get } from '@nestjs/common';`,
        `import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';`
    ];

    if (checkDatabase) imports.push(`import { TypeOrmHealthIndicator } from '@nestjs/terminus';`);
    if (checkMemory) imports.push(`import { MemoryHealthIndicator } from '@nestjs/terminus';`);

    const constructorArgs = ['private health: HealthCheckService'];
    const checks = [];

    if (checkDatabase) {
        constructorArgs.push('private db: TypeOrmHealthIndicator');
        checks.push(`() => this.db.pingCheck('database')`);
    }

    if (checkMemory) {
        constructorArgs.push('private memory: MemoryHealthIndicator');
        checks.push(`() => this.memory.checkHeap('memory_heap', ${memoryThresholdMB} * 1024 * 1024)`);
    }

    const code = `${imports.join('\n')}

@Controller('health')
export class HealthController {
  constructor(
    ${constructorArgs.join(',\n    ')}
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      ${checks.join(',\n      ')}
    ]);
  }
}
`;

    return {
        success: true,
        data: code,
        metadata: {
            dependencies: ['@nestjs/terminus', '@nestjs/axios'], // terminus usually needs axios
            endpoint: '/health'
        }
    };
};

export const healthCheckBuilderSkillDefinition: SkillDefinition<typeof HealthCheckBuilderSchema> = {
    name: 'health_check_builder',
    description: 'Generates a HealthController using NestJS Terminus for DB and Memory checks.',
    parameters: HealthCheckBuilderSchema,
    handler,
};
