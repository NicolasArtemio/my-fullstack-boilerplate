import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';


const generateNestResourceSchema = z.object({
  resourceName: z.string().describe('The name of the resource (e.g., "users")'),
  path: z.string().default('src').describe('The root path for generation'),
  components: z.array(z.enum(['module', 'controller', 'service', 'dto', 'entity']))
    .default(['module', 'controller', 'service'])
    .describe('List of components to generate'),
  isCrud: z.boolean().default(true).describe('Whether to generate CRUD methods'),
});

const handler = async (args: z.infer<typeof generateNestResourceSchema>): Promise<SkillResult> => {
  const { resourceName, path, components, isCrud } = args;
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const className = capitalize(resourceName);

  const files: Record<string, string> = {};
  const basePath = `${path}/${resourceName}`;

  if (components.includes('controller')) {
    files[`${basePath}/${resourceName}.controller.ts`] = `
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ${className}Service } from './${resourceName}.service';
${components.includes('dto') ? `import { Create${className}Dto } from './dto/create-${resourceName}.dto';` : ''}
${components.includes('dto') ? `import { Update${className}Dto } from './dto/update-${resourceName}.dto';` : ''}

@Controller('${resourceName}')
export class ${className}Controller {
  constructor(private readonly ${resourceName}Service: ${className}Service) {}

  ${isCrud ? `
  @Post()
  create(@Body() create${className}Dto: ${components.includes('dto') ? `Create${className}Dto` : 'any'}) {
    return this.${resourceName}Service.create(create${className}Dto);
  }

  @Get()
  findAll() {
    return this.${resourceName}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${resourceName}Service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() update${className}Dto: ${components.includes('dto') ? `Update${className}Dto` : 'any'}) {
    return this.${resourceName}Service.update(+id, update${className}Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${resourceName}Service.remove(+id);
  }` : ''}
}
`;
  }

  if (components.includes('service')) {
    files[`${basePath}/${resourceName}.service.ts`] = `
import { Injectable } from '@nestjs/common';
${components.includes('dto') ? `import { Create${className}Dto } from './dto/create-${resourceName}.dto';` : ''}
${components.includes('dto') ? `import { Update${className}Dto } from './dto/update-${resourceName}.dto';` : ''}

@Injectable()
export class ${className}Service {
  ${isCrud ? `
  create(create${className}Dto: ${components.includes('dto') ? `Create${className}Dto` : 'any'}) {
    return 'This action adds a new ${resourceName}';
  }

  findAll() {
    return \`This action returns all ${resourceName}\`;
  }

  findOne(id: number) {
    return \`This action returns a #\${id} ${resourceName}\`;
  }

  update(id: number, update${className}Dto: ${components.includes('dto') ? `Update${className}Dto` : 'any'}) {
    return \`This action updates a #\${id} ${resourceName}\`;
  }

  remove(id: number) {
    return \`This action removes a #\${id} ${resourceName}\`;
  }` : ''}
}
`;
  }

  if (components.includes('module')) {
    files[`${basePath}/${resourceName}.module.ts`] = `
import { Module } from '@nestjs/common';
import { ${className}Service } from './${resourceName}.service';
import { ${className}Controller } from './${resourceName}.controller';

@Module({
  controllers: [${className}Controller],
  providers: [${className}Service],
})
export class ${className}Module {}
`;
  }

  // DTOs placeholder
  if (components.includes('dto')) {
    files[`${basePath}/dto/create-${resourceName}.dto.ts`] = `export class Create${className}Dto {}`;
    files[`${basePath}/dto/update-${resourceName}.dto.ts`] = `import { PartialType } from '@nestjs/mapped-types';\nimport { Create${className}Dto } from './create-${resourceName}.dto';\n\nexport class Update${className}Dto extends PartialType(Create${className}Dto) {}`;
  }

  return {
    success: true,
    data: files,
    metadata: {
      generatedFiles: Object.keys(files),
      description: `Generated NestJS resource for ${resourceName}`,
    },
  };
};

export const generateNestResource: SkillDefinition<typeof generateNestResourceSchema> = {
  name: 'generate_nest_resource',
  description: 'Generates NestJS module, controller, and service files following modular architecture.',
  parameters: generateNestResourceSchema,
  handler,
};
