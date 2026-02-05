import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const UnitTestGeneratorSchema = z.object({
    serviceName: z.string().describe('Name of the service class to test, e.g. UsersService'),
    dependencies: z.array(z.string()).default([]).describe('List of injected dependency names, e.g. ["UsersRepository", "ConfigService"]'),
    methods: z.array(z.string()).default([]).describe('List of public methods to generate test stubs for'),
});

const handler = async (args: z.infer<typeof UnitTestGeneratorSchema>): Promise<SkillResult> => {
    const { serviceName, dependencies, methods } = args;

    const mockProviders = dependencies.map(dep => `
    {
      provide: ${dep},
      useValue: {
        // Mock implementation
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    }`).join(',');

    const methodTests = methods.map(method => `
  describe('${method}', () => {
    it('should be defined', () => {
      expect(service.${method}).toBeDefined();
    });
    
    // Add more specific tests here
    // it('should return result', async () => { ... });
  });`).join('\n');

    const code = `import { Test, TestingModule } from '@nestjs/testing';
import { ${serviceName} } from './${serviceName.replace(/Service$/, '').toLowerCase()}.service';
${dependencies.map(d => `// import { ${d} } from ...;`).join('\n')}

describe('${serviceName}', () => {
  let service: ${serviceName};
  ${dependencies.map(d => `let ${d.toLowerCase()}: ${d};`).join('\n')}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${serviceName},
        ${mockProviders}
      ],
    }).compile();

    service = module.get<${serviceName}>(${serviceName});
    ${dependencies.map(d => `${d.toLowerCase()} = module.get<${d}>(${d});`).join('\n')}
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

${methodTests}
});
`;

    return {
        success: true,
        data: code,
        metadata: {
            testFramework: 'jest',
            targetService: serviceName
        }
    };
};

export const unitTestGeneratorSkillDefinition: SkillDefinition<typeof UnitTestGeneratorSchema> = {
    name: 'unit_test_generator',
    description: 'Generates a Jest .spec.ts file for a NestJS service with automatic mocking dependencies.',
    parameters: UnitTestGeneratorSchema,
    handler,
};
