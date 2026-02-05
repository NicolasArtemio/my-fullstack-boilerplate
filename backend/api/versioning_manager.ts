import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const VersioningManagerSchema = z.object({
    type: z.enum(['URI', 'HEADER', 'MEDIA_TYPE']).default('URI').describe('Versioning type'),
    defaultVersion: z.string().default('1').describe('Default API version'),
    prefix: z.string().default('api/v').describe('Prefix for URI versioning (not strictly used by NestJS standard config but useful for context)'),
});

const handler = async (args: z.infer<typeof VersioningManagerSchema>): Promise<SkillResult> => {
    const { type, defaultVersion } = args;

    const code = `import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Versioning
  app.enableVersioning({
    type: VersioningType.${type},
    defaultVersion: '${defaultVersion}',
  });

  await app.listen(3000);
}
bootstrap();
`;

    return {
        success: true,
        data: code,
        metadata: {
            versioningType: type,
            defaultVersion
        }
    };
};

export const versioningManagerSkillDefinition: SkillDefinition<typeof VersioningManagerSchema> = {
    name: 'versioning_manager',
    description: 'Generates bootstrap code for enabling global API versioning in NestJS.',
    parameters: VersioningManagerSchema,
    handler,
};
