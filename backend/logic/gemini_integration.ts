import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const GeminiIntegrationSchema = z.object({
    serviceName: z.string().default('GeminiService').describe('Name of the service class'),
    apiKeyEnvVar: z.string().default('GEMINI_API_KEY').describe('Environment variable name for the API key'),
    modelName: z.string().default('gemini-pro').describe('Default model to use (gemini-pro, gemini-pro-vision)'),
});

const handler = async (args: z.infer<typeof GeminiIntegrationSchema>): Promise<SkillResult> => {
    const { serviceName, apiKeyEnvVar, modelName } = args;

    const code = `import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';

@Injectable()
export class ${serviceName} {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('${apiKeyEnvVar}');
    if (!apiKey) {
      throw new Error('${apiKeyEnvVar} is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: '${modelName}' });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw new InternalServerErrorException('Failed to generate content from Gemini');
    }
  }

  async generateStream(prompt: string) {
    try {
      const result = await this.model.generateContentStream(prompt);
      return result.stream;
    } catch (error) {
      console.error('Error generating stream:', error);
      throw new InternalServerErrorException('Failed to generate stream from Gemini');
    }
  }

  startChat(history: { role: 'user' | 'model'; parts: string }[] = []): ChatSession {
    return this.model.startChat({
      history: history.map(h => ({ role: h.role, parts: [{ text: h.parts }] })),
    });
  }

  async chatMessage(session: ChatSession, message: string): Promise<string> {
    try {
      const result = await session.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in chat message:', error);
      throw new InternalServerErrorException('Failed to send message to Gemini');
    }
  }
}
`;

    return {
        success: true,
        data: code,
        metadata: {
            dependencies: ['@google/generative-ai', '@nestjs/config'],
            envVar: apiKeyEnvVar
        }
    };
};

export const geminiIntegrationSkillDefinition: SkillDefinition<typeof GeminiIntegrationSchema> = {
    name: 'gemini_integration',
    description: 'Generates a NestJS service for Google Gemini AI integration, supporting text generation, streaming, and chat sessions.',
    parameters: GeminiIntegrationSchema,
    handler,
};
