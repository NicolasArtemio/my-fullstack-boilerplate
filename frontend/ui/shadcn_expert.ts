import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const ShadcnSchema = z.object({
    componentType: z.enum(["card", "form", "data-table", "modal"]).describe("Type of component to generate"),
    dataFields: z.array(z.string()).describe("List of data fields to include"),
});

export const shadcnHandler = async (args: z.infer<typeof ShadcnSchema>): Promise<SkillResult> => {
    const { componentType, dataFields } = args;

    // Placeholder logic
    const codeSnippet = `// Shadcn ${componentType} component\n// Fields: ${dataFields.join(', ')}\n// Implementation pending actual AST manipulation`;

    return {
        success: true,
        data: codeSnippet,
        metadata: {
            style: 'shadcn/ui',
            component: componentType
        }
    };
};

export const shadcnSkillDefinition: SkillDefinition<typeof ShadcnSchema> = {
    name: "apply_shadcn_style",
    description: "Aplica componentes de Shadcn UI (Cards, Dialogs, Tables) siguiendo el sistema de diseño moderno y dark mode.",
    parameters: ShadcnSchema,
    handler: shadcnHandler,
};
