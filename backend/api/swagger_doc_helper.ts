import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const SwaggerDocHelperSchema = z.object({
    properties: z.array(z.object({
        name: z.string(),
        type: z.string().describe('e.g., string, number, boolean'),
        description: z.string().optional(),
        example: z.any().optional(),
        required: z.boolean().default(true),
    })).describe('List of properties to decorate'),
    className: z.string().default('GeneratedDto').describe('Name of the class'),
});

const handler = async (args: z.infer<typeof SwaggerDocHelperSchema>): Promise<SkillResult> => {
    const { properties, className } = args;

    const propertyCodes = properties.map(prop => {
        const apiPropOptions = [];
        if (prop.description) apiPropOptions.push(`description: '${prop.description}'`);
        if (prop.example !== undefined) apiPropOptions.push(`example: ${JSON.stringify(prop.example)}`);
        if (prop.required === false) apiPropOptions.push(`required: false`);

        // Map basic types to JS construtors for ApiProperty if needed, but usually it infers or we pass types directly?
        // NestJS Swagger usually infers types if using TS, but explicit type is sometimes needed.
        // simpler to just pass the options object.

        const optionsStr = apiPropOptions.length ? `{ ${apiPropOptions.join(', ')} }` : '';
        const optionalMark = prop.required ? '' : '?';
        const exclamationMark = prop.required ? '!' : '';

        return `
  @ApiProperty(${optionsStr})
  ${prop.name}${optionalMark}: ${prop.type};`;
    }).join('\n');

    const code = `import { ApiProperty } from '@nestjs/swagger';

export class ${className} {
${propertyCodes}
}
`;

    return {
        success: true,
        data: code,
        metadata: {
            documentation: 'NestJS Swagger DTO',
            decoratedProperties: properties.map(p => p.name)
        }
    };
};

export const swaggerDocHelperSkillDefinition: SkillDefinition<typeof SwaggerDocHelperSchema> = {
    name: 'swagger_doc_helper',
    description: 'Generates a DTO class with @ApiProperty decorators for Swagger documentation.',
    parameters: SwaggerDocHelperSchema,
    handler,
};
