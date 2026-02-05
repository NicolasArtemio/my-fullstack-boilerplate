import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const FileUploadManagerSchema = z.object({
    provider: z.enum(['cloudinary', 's3']).default('cloudinary').describe('Storage provider'),
    folderName: z.string().default('uploads').describe('Folder name in the cloud storage'),
    allowedMimeTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'application/pdf']).describe('Allowed file types'),
});

const handler = async (args: z.infer<typeof FileUploadManagerSchema>): Promise<SkillResult> => {
    const { provider, folderName } = args;

    let serviceCode = '';

    if (provider === 'cloudinary') {
        serviceCode = `import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response'; // Interface needed
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: '${folderName}' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
`;
    } else {
        // S3 Placeholder
        serviceCode = `// AWS S3 implementation would go here using @aws-sdk/client-s3`;
    }

    const providerSetup = provider === 'cloudinary' ? `
export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  },
};` : '';

    return {
        success: true,
        data: {
            'file-upload.service.ts': serviceCode,
            'provider.ts': providerSetup
        },
        metadata: {
            provider,
            dependencies: provider === 'cloudinary' ? ['cloudinary', 'streamifier', '@types/streamifier'] : ['@aws-sdk/client-s3']
        }
    };
};

export const fileUploadManagerSkillDefinition: SkillDefinition<typeof FileUploadManagerSchema> = {
    name: 'file_upload_manager',
    description: 'Generates a file upload service for Cloudinary or S3.',
    parameters: FileUploadManagerSchema,
    handler,
};
