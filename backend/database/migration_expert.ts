import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const MigrationExpertSchema = z.object({
    migrationName: z.string().describe('Descriptive name of the migration, e.g., CreateUsersTable'),
});

const handler = async (args: z.infer<typeof MigrationExpertSchema>): Promise<SkillResult> => {
    const { migrationName } = args;
    const timestamp = Date.now();
    const className = `${migrationName}${timestamp}`;

    const code = `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${className} implements MigrationInterface {
    name = '${className}'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Example: await queryRunner.query(\`CREATE TABLE "user" ... \`);
        // Add your schema changes here
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Example: await queryRunner.query(\`DROP TABLE "user"\`);
        // Revert your schema changes here
    }
}
`;

    return {
        success: true,
        data: code,
        metadata: {
            migrationClass: className,
            timestamp
        }
    };
};

export const migrationExpertSkillDefinition: SkillDefinition<typeof MigrationExpertSchema> = {
    name: 'migration_expert',
    description: 'Generates a TypeORM migration class template with up/down methods and timestamping.',
    parameters: MigrationExpertSchema,
    handler,
};
