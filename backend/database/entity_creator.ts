import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const EntityCreatorSchema = z.object({
    entityName: z.string().describe('Name of the entity class (PascalCase), e.g., UserProfile'),
    tableName: z.string().optional().describe('Optional custom table name. Defaults to entityName in snake_case.'),
    columns: z.array(z.object({
        name: z.string(),
        type: z.string().describe('TypeORM column type, e.g., varchar, int, boolean, timestamp'),
        isPrimary: z.boolean().optional(),
        isNullable: z.boolean().optional(),
        default: z.union([z.string(), z.number(), z.boolean()]).optional(),
    })).describe('List of columns definitions'),
    relations: z.array(z.object({
        type: z.enum(['OneToMany', 'ManyToOne', 'OneToOne', 'ManyToMany']),
        targetEntity: z.string().describe('The name of the related entity class'),
        inverseSide: z.string().optional().describe('Property name on the other side of the relation'),
        joinColumn: z.boolean().optional().describe('Whether to add @JoinColumn (owning side)'),
    })).optional().describe('List of entity relations'),
});

const handler = async (args: z.infer<typeof EntityCreatorSchema>): Promise<SkillResult> => {
    const { entityName, tableName, columns, relations } = args;

    const imports = new Set([
        'Entity', 'PrimaryGeneratedColumn', 'Column',
        'CreateDateColumn', 'UpdateDateColumn'
    ]);

    // Add relation imports
    if (relations?.length) {
        relations.forEach(r => imports.add(r.type));
        if (relations.some(r => r.joinColumn)) imports.add('JoinColumn');
    }

    const importString = `import { ${Array.from(imports).join(', ')} } from 'typeorm';`;

    let relationImports = '';
    // Ideally, we would import related entities here, but we can assume they are in the same folder or handle it later.
    // For now we assume they are available or circular imports are handled via strings/arrow functions in decorators.

    const columnDefinitions = columns.map(col => {
        if (col.isPrimary) {
            return `
  @PrimaryGeneratedColumn('uuid')
  ${col.name}: string;`;
        }

        const optionsParts = [];
        if (col.isNullable) optionsParts.push(`nullable: true`);
        if (col.default !== undefined) {
            const defVal = typeof col.default === 'string' ? `'${col.default}'` : col.default;
            optionsParts.push(`default: ${defVal}`);
        }

        const options = optionsParts.length ? `{ ${optionsParts.join(', ')} }` : '';

        // Map simplified types to TS types
        let tsType = 'string';
        if (['int', 'integer', 'float', 'decimal', 'double'].includes(col.type)) tsType = 'number';
        if (['boolean', 'bool'].includes(col.type)) tsType = 'boolean';
        if (['timestamp', 'date', 'datetime'].includes(col.type)) tsType = 'Date';

        return `
  @Column('${col.type}', ${options})
  ${col.name}: ${tsType};`;
    }).join('\n');

    const relationDefinitions = relations?.map(rel => {
        let decoratorArgs = `() => ${rel.targetEntity}`;
        if (rel.inverseSide) {
            decoratorArgs += `, (related) => related.${rel.inverseSide}`;
        }

        let propCode = `
  @${rel.type}(${decoratorArgs})
  @JoinColumn()
  ${rel.targetEntity.toLowerCase()}: ${rel.targetEntity};`;

        if (!rel.joinColumn) {
            // Remove JoinColumn if not requested
            propCode = propCode.replace('@JoinColumn()\n  ', '');
        }

        if (rel.type === 'OneToMany') {
            propCode = `
  @${rel.type}(${decoratorArgs})
  ${rel.targetEntity.toLowerCase()}s: ${rel.targetEntity}[];`;
        }

        return propCode;
    }).join('\n') || '';

    const tableOption = tableName ? `name: '${tableName}'` : '';

    const code = `${importString}

@Entity({ ${tableOption} })
export class ${entityName} {
${columnDefinitions}
${relationDefinitions}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;

    return {
        success: true,
        data: code,
        metadata: {
            entity: entityName,
            table: tableName || entityName.toLowerCase(),
            typeormVersion: '0.3.x'
        }
    };
};

export const entityCreatorSkillDefinition: SkillDefinition<typeof EntityCreatorSchema> = {
    name: 'entity_creator',
    description: 'Generates a TypeORM entity with columns, decorators, and relations.',
    parameters: EntityCreatorSchema,
    handler,
};
