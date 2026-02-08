import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const CronJobSchedulerSchema = z.object({
    serviceName: z.string().default('Tasks').describe('Service name (PascalCase)'),
    jobs: z.array(z.object({
        name: z.string(),
        cron: z.string(),
        description: z.string().optional(),
    })).default([
        { name: 'cleanupExpired', cron: '0 0 * * *', description: 'Daily cleanup' },
    ]),
    withLocking: z.boolean().default(true),
});

const handler = async (args: z.infer<typeof CronJobSchedulerSchema>): Promise<SkillResult> => {
    const { serviceName, jobs, withLocking } = args;
    const files: Record<string, string> = {};
    const lowerName = serviceName.toLowerCase();

    const jobMethods = jobs.map(job => `
  @Cron('${job.cron}')
  async ${job.name}() {
    this.logger.log('${job.name}: Started');
    // TODO: Implement job logic
  }`).join('\n');

    files[`${lowerName}.service.ts`] = `import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ${serviceName}Service {
  private readonly logger = new Logger(${serviceName}Service.name);
  ${jobMethods}
}`;

    files[`${lowerName}.module.ts`] = `import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ${serviceName}Service } from './${lowerName}.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [${serviceName}Service],
  exports: [${serviceName}Service],
})
export class ${serviceName}Module {}`;

    return { success: true, data: files, metadata: { serviceName, jobs: jobs.map(j => j.name) } };
};

export const cronJobSchedulerSkillDefinition: SkillDefinition<typeof CronJobSchedulerSchema> = {
    name: 'cron_job_scheduler',
    description: 'Generates NestJS scheduled tasks with @nestjs/schedule.',
    parameters: CronJobSchedulerSchema,
    handler,
};
