import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const LoadTestConfigSchema = z.object({
    targetUrl: z.string().url().describe('The base endpoint URL to stress test'),
    vus: z.number().default(10).describe('Number of Virtual Users'),
    duration: z.string().default('30s').describe('Duration of the test, e.g. 30s, 1m'),
});

const handler = async (args: z.infer<typeof LoadTestConfigSchema>): Promise<SkillResult> => {
    const { targetUrl, vus, duration } = args;

    const code = `import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: ${vus},
  duration: '${duration}',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

export default function () {
  const res = http.get('${targetUrl}');
  
  check(res, {
    'is status 200': (r) => r.status === 200,
    'protocol is HTTP/2': (r) => r.proto === 'HTTP/2.0',
  });
  
  sleep(1);
}
`;

    return {
        success: true,
        data: code,
        metadata: {
            tool: 'k6',
            scenario: 'simple-load-test'
        }
    };
};

export const loadTestConfigSkillDefinition: SkillDefinition<typeof LoadTestConfigSchema> = {
    name: 'load_test_config',
    description: 'Generates a K6 load testing script.',
    parameters: LoadTestConfigSchema,
    handler,
};
