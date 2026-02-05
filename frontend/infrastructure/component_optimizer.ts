import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const ComponentOptimizerSchema = z.object({
    code: z.string().describe('The source code of the component to analyze'),
    fileName: z.string().describe('The filename of the component'),
});

const handler = async (args: z.infer<typeof ComponentOptimizerSchema>): Promise<SkillResult> => {
    const { code, fileName } = args;
    const issues: string[] = [];
    let recommendedType: 'server' | 'client' = 'server';
    const reasoning: string[] = [];

    // Heuristics for Client Component requirements
    const clientHooks = ['useState', 'useEffect', 'useCallback', 'useContext', 'useRef', 'useReducer'];
    const eventHandlers = ['onClick', 'onChange', 'onSubmit', 'onMouseEnter'];

    const hasClientHooks = clientHooks.some(hook => code.includes(hook));
    const hasEventHandlers = eventHandlers.some(handler => code.includes(handler));
    const hasBrowserAPIs = ['window.', 'document.', 'localStorage', 'sessionStorage'].some(api => code.includes(api));

    if (hasClientHooks || hasEventHandlers || hasBrowserAPIs) {
        recommendedType = 'client';
        if (hasClientHooks) reasoning.push('Uses React hooks (state/effect)');
        if (hasEventHandlers) reasoning.push('Uses event handlers (interactions)');
        if (hasBrowserAPIs) reasoning.push('Uses Browser APIs');
    } else {
        reasoning.push('No interactive logic or state detected; safe for Server Component');
    }

    // Check existing directive
    const hasUseClient = code.trim().startsWith("'use client'") || code.trim().startsWith('"use client"');

    if (recommendedType === 'server' && hasUseClient) {
        issues.push("Component is marked 'use client' but appears to be static. Consider removing directive for better performance.");
    } else if (recommendedType === 'client' && !hasUseClient) {
        issues.push("Component uses interactive features but is missing 'use client' directive.");
    }

    return {
        success: true,
        data: {
            fileName,
            recommendedType,
            reasoning,
            issues
        },
        metadata: {
            optimizationLevel: 'high'
        }
    };
};

export const componentOptimizerSkillDefinition: SkillDefinition<typeof ComponentOptimizerSchema> = {
    name: 'component_optimizer',
    description: 'Analyzes React components to recommend Server vs Client rendering strategies for Next.js optimization.',
    parameters: ComponentOptimizerSchema,
    handler,
};
