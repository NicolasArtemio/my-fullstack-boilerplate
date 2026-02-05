import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const AiCopywriterSchema = z.object({
    componentContext: z.string().describe('The UI component context (e.g. "Empty State for Orders", "Hero Section for SaaS")'),
    targetAudience: z.string().default('General').describe('Target audience tone (e.g. "Professional", "Gen Z", "Medical")'),
});

const handler = async (args: z.infer<typeof AiCopywriterSchema>): Promise<SkillResult> => {
    const { componentContext, targetAudience } = args;

    // In a real scenario, this would call an LLM API.
    // Here we use template-based heuristics to simulate "creative" copy.

    let title = "Welcome";
    let description = "Please interact with the application.";
    let cta = "Click here";

    if (componentContext.toLowerCase().includes("empty")) {
        if (targetAudience.includes("Gen Z")) {
            title = "Nothing to see here... yet! 👀";
            description = "Start your journey by adding your first item. It's gonna be epic.";
            cta = "Let's Go 🚀";
        } else {
            title = "No Data Available";
            description = "It looks like you haven't created any records yet. Get started by clicking the button below.";
            cta = "Create New";
        }
    } else if (componentContext.toLowerCase().includes("hero")) {
        if (targetAudience.includes("Medical")) {
            title = "Advanced Care for Modern Practice";
            description = "Streamline your veterinary operations with our state-of-the-art management suite.";
            cta = "Book Demo";
        } else {
            title = "Supercharge Your Workflow";
            description = "The all-in-one platform to manage your business efficiently and effectively.";
            cta = "Start Free Trial";
        }
    }

    return {
        success: true,
        data: {
            title,
            description,
            cta
        },
        metadata: {
            tone: targetAudience,
            context: componentContext
        }
    };
};

export const aiCopywriterSkillDefinition: SkillDefinition<typeof AiCopywriterSchema> = {
    name: 'ai_copywriter',
    description: 'Generates engaging, audience-tailored UI copy for placeholders and empty states.',
    parameters: AiCopywriterSchema,
    handler,
};
