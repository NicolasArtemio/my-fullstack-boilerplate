import { z } from 'zod';

export interface SkillResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, any>;
}

export interface SkillDefinition<T extends z.ZodTypeAny> {
    name: string;
    description: string;
    parameters: T; // Zod Schema for validation
    handler: (args: z.infer<T>) => Promise<SkillResult>;
}
