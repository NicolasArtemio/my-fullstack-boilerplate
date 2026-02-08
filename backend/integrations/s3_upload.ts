import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const S3UploadSchema = z.object({
    provider: z.enum(['s3', 'r2', 'supabase']).default('s3'),
    bucketEnvVar: z.string().default('S3_BUCKET'),
    generatePresignedUrls: z.boolean().default(true),
    allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
});

const handler = async (args: z.infer<typeof S3UploadSchema>): Promise<SkillResult> => {
    const { provider, bucketEnvVar, generatePresignedUrls, allowedTypes } = args;
    const files: Record<string, string> = {};

    files['upload.module.ts'] = `import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}`;

    files['upload.service.ts'] = `import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket = process.env.${bucketEnvVar};
  private allowedTypes = ${JSON.stringify(allowedTypes)};

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      ${provider === 'r2' ? `endpoint: process.env.R2_ENDPOINT,` : ''}
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async upload(file: Express.Multer.File, folder = 'uploads'): Promise<{ url: string; key: string }> {
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(\`File type \${file.mimetype} not allowed\`);
    }

    const ext = file.originalname.split('.').pop();
    const key = \`\${folder}/\${uuid()}.\${ext}\`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return {
      url: \`https://\${this.bucket}.s3.amazonaws.com/\${key}\`,
      key,
    };
  }

  ${generatePresignedUrls ? `async getPresignedUploadUrl(filename: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    const ext = filename.split('.').pop();
    const key = \`uploads/\${uuid()}.\${ext}\`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { uploadUrl, key };
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }` : ''}

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}`;

    files['upload.controller.ts'] = `import { Controller, Post, UploadedFile, UseInterceptors, Get, Query, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.upload(file);
  }

  ${generatePresignedUrls ? `@Get('presigned')
  async getPresigned(@Query('filename') filename: string, @Query('contentType') contentType: string) {
    return this.uploadService.getPresignedUploadUrl(filename, contentType);
  }` : ''}

  @Delete(':key')
  async delete(@Param('key') key: string) {
    await this.uploadService.delete(key);
    return { success: true };
  }
}`;

    return {
        success: true,
        data: files,
        metadata: { provider, generatedFiles: Object.keys(files) },
    };
};

export const s3UploadSkillDefinition: SkillDefinition<typeof S3UploadSchema> = {
    name: 's3_upload_manager',
    description: 'Generates S3/R2/Supabase file upload service with presigned URLs.',
    parameters: S3UploadSchema,
    handler,
};
