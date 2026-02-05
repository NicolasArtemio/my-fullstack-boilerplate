import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

const analyzeHookLogicSchema = z.object({
    code: z.string().describe('The source code of the custom hook to analyze'),
    fileName: z.string().describe('The filename, used for convention checks'),
    strict: z.boolean().default(true).describe('Enable strict mode for dependency checks'),
});

const handler = async (args: z.infer<typeof analyzeHookLogicSchema>): Promise<SkillResult> => {
    const { code, fileName } = args;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 1. Check naming convention
    const hookNameMatch = code.match(/export\s+(?:const|function)\s+(use[A-Z][a-zA-Z0-9]*)/);
    const hookName = hookNameMatch ? hookNameMatch[1] : null;

    if (!fileName.includes('use') && !hookName) {
        issues.push('Could not detect a valid hook definition starting with "use" exported from this file.');
    }

    // 2. Check for missing dependency arrays in useEffect/useCallback/useMemo
    // This is a naive regex check for demonstration purposes. 
    // A real implementation would use an AST parser.
    const regexEffects = /\b(useEffect|useCallback|useMemo)\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)/g; // Missing second arg
    if (regexEffects.test(code)) {
        issues.push('Found useEffect/useCallback/useMemo without a dependency array. This can cause infinite loops or stale closures.');
    }

    // 3. Heavy computation check inside render body (heuristic)
    if (code.includes('.filter(') && code.includes('.map(') && !code.includes('useMemo')) {
        suggestions.push('Chained array operations (.filter.map) found. Consider wrapping heavy computations in useMemo().');
    }

    // 4. Return value check
    if (!code.includes('return')) {
        issues.push('Hook does not seem to return any value or controls. Ensure it returns the necessary state or handlers.');
    }

    return {
        success: issues.length === 0,
        data: {
            hookName,
            validConvention: !!hookName,
            issues,
            suggestions,
        },
        metadata: {
            analyzedLines: code.split('\n').length,
        }
    };
};

export const analyzeHookLogic: SkillDefinition<typeof analyzeHookLogicSchema> = {
    name: 'analyze_hook_logic',
    description: 'Audits custom React hooks for common pitfalls, naming conventions, and performance optimizations.',
    parameters: analyzeHookLogicSchema,
    handler,
};
