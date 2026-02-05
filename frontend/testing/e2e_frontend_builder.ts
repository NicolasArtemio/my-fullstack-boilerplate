import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const E2EFrontendBuilderSchema = z.object({
    testName: z.string().describe('Name of the E2E test suite'),
    startUrl: z.string().describe('Initial URL to visit'),
    steps: z.array(z.object({
        action: z.enum(['click', 'fill', 'check', 'assert_url', 'assert_text']),
        selector: z.string().optional().describe('CSS selector or role locator'),
        value: z.string().optional().describe('Value to fill or text to assert'),
    })).describe('List of user interactions'),
});

const handler = async (args: z.infer<typeof E2EFrontendBuilderSchema>): Promise<SkillResult> => {
    const { testName, startUrl, steps } = args;

    const stepsCode = steps.map(step => {
        switch (step.action) {
            case 'click':
                return `    await page.click('${step.selector}');`;
            case 'fill':
                return `    await page.fill('${step.selector}', '${step.value}');`;
            case 'check':
                return `    await page.check('${step.selector}');`;
            case 'assert_url':
                return `    await expect(page).toHaveURL(/${step.value}/);`;
            case 'assert_text':
                return `    await expect(page.locator('${step.selector}')).toContainText('${step.value}');`;
            default: return '';
        }
    }).join('\n');

    const code = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ page }) => {
  await page.goto('${startUrl}');

${stepsCode}
});
`;

    return {
        success: true,
        data: code,
        metadata: {
            framework: 'playwright',
            browsers: ['chromium', 'firefox', 'webkit']
        }
    };
};

export const e2eFrontendBuilderSkillDefinition: SkillDefinition<typeof E2EFrontendBuilderSchema> = {
    name: 'e2e_frontend_builder',
    description: 'Generates Playwright E2E test scripts for user flows.',
    parameters: E2EFrontendBuilderSchema,
    handler,
};
