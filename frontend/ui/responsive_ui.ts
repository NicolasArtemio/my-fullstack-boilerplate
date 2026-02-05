import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const ResponsiveSchema = z.object({
    componentDescription: z.string().describe("Descripción de la interfaz (ej. Dashboard de métricas)"),
    constraints: z.array(z.string()).optional().describe("Restricciones como 'sin scroll horizontal'"),
});

export const responsiveHandler = async (args: z.infer<typeof ResponsiveSchema>): Promise<SkillResult> => {
    // Aquí el agente devuelve el código usando utilidades de Tailwind como grid-cols-1 md:grid-cols-12
    const { componentDescription } = args;

    // Simulate generation logic or return the user's fixed string
    const result = `Estructura generada con estrategia Mobile-First para: ${componentDescription}.
Se aplicaron breakpoints 'sm' y 'md' para asegurar los 60fps y legibilidad en pantallas chicas.
Clases sugeridas: 'grid grid-cols-1 md:grid-cols-12 gap-4 p-4'`;

    return {
        success: true,
        data: result,
        metadata: {
            strategy: 'mobile-first',
            breakpoints: ['sm', 'md']
        }
    };
};

export const responsiveSkillDefinition: SkillDefinition<typeof ResponsiveSchema> = {
    name: "generate_responsive_layout",
    description: "Crea layouts modernos con Tailwind asegurando adaptabilidad en móviles y pantallas pequeñas usando Shadcn.",
    parameters: ResponsiveSchema,
    handler: responsiveHandler,
};
