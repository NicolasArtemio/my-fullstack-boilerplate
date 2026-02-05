import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const LoggerProviderSchema = z.object({
    library: z.enum(['winston', 'pino']).default('winston').describe('Logging library to use'),
    contextName: z.string().default('MyApp').describe('Default context name for the logger'),
});

const handler = async (args: z.infer<typeof LoggerProviderSchema>): Promise<SkillResult> => {
    const { library, contextName } = args;

    let code = '';
    if (library === 'winston') {
        code = `import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('${contextName}', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    // Add File transport here if needed
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

// Usage in main.ts:
// app.useLogger(loggerConfig);
`;
    } else {
        // Pino setup
        code = `import { LoggerErrorInterceptor } from 'nestjs-pino';
// Make sure to import LoggerModule from 'nestjs-pino' in AppModule

export const pinoConfig = {
  pinoHttp: {
    name: '${contextName}',
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
  },
};
`;
    }

    return {
        success: true,
        data: code,
        metadata: {
            library,
            recommendedDependencies: library === 'winston'
                ? ['nest-winston', 'winston']
                : ['nestjs-pino', 'pino-http', 'pino-pretty']
        }
    };
};

export const loggerProviderSkillDefinition: SkillDefinition<typeof LoggerProviderSchema> = {
    name: 'logger_provider',
    description: 'Generates configuration for structured logging (Winston or Pino).',
    parameters: LoggerProviderSchema,
    handler,
};
