import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const HookTestGeneratorSchema = z.object({
    hookName: z.string().describe('Name of the hook to test, e.g. useCounter'),
    initialProps: z.any().optional(),
    actions: z.array(z.string()).default([]).describe('List of functions returned by the hook to call'),
});

const handler = async (args: z.infer<typeof HookTestGeneratorSchema>): Promise<SkillResult> => {
    const { hookName, initialProps, actions } = args;

    const code = `import { renderHook, act } from '@testing-library/react-hooks';
import { ${hookName} } from './${hookName}';

describe('${hookName}', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => ${hookName}(${initialProps ? JSON.stringify(initialProps) : ''}));
    expect(result.current).toBeDefined();
    // Add specific assertions here
  });

  ${actions.map(action => `
  it('should handle ${action} correctly', () => {
    const { result } = renderHook(() => ${hookName}(${initialProps ? JSON.stringify(initialProps) : ''}));
    
    act(() => {
      result.current.${action}();
    });

    // expect(result.current.state).toBe(...);
  });`).join('\n')}
});
`;

    return {
        success: true,
        data: code,
        metadata: {
            library: 'react-testing-library-hooks (or v18 renderHook)',
            note: 'If using React 18+, import renderHook from @testing-library/react'
        }
    };
};

export const hookTestGeneratorSkillDefinition: SkillDefinition<typeof HookTestGeneratorSchema> = {
    name: 'hook_test_generator',
    description: 'Generates unit tests for custom React hooks.',
    parameters: HookTestGeneratorSchema,
    handler,
};
