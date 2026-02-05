import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const E2ETestBuilderSchema = z.object({
    targetModule: z.string().default('AppModule').describe('The root module to compile for the test'),
    routePrefix: z.string().describe('The route prefix to test, e.g. /users'),
});

const handler = async (args: z.infer<typeof E2ETestBuilderSchema>): Promise<SkillResult> => {
    const { targetModule, routePrefix } = args;

    const code = `import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ${targetModule} } from './../src/app.module';

describe('${targetModule} (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [${targetModule}],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('${routePrefix} (GET)', () => {
    return request(app.getHttpServer())
      .get('${routePrefix}')
      .expect(200)
      // .expect('Content-Type', /json/)
      // .expect((res) => {
      //    expect(res.body).toBeInstanceOf(Array);
      // })
      ;
  });

  it('${routePrefix} (POST) - creation', () => {
    return request(app.getHttpServer())
      .post('${routePrefix}')
      .send({
        // Add sample payload here
        name: 'Test E2E'
      })
      .expect(201);
  });
});
`;

    return {
        success: true,
        data: code,
        metadata: {
            type: 'e2e',
            library: 'supertest'
        }
    };
};

export const e2eTestBuilderSkillDefinition: SkillDefinition<typeof E2ETestBuilderSchema> = {
    name: 'e2e_test_builder',
    description: 'Generates NestJS Integration/E2E tests using Supertest.',
    parameters: E2ETestBuilderSchema,
    handler,
};
