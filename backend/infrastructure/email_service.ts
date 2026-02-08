import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const EmailServiceSchema = z.object({
    provider: z.enum(['nodemailer', 'sendgrid', 'resend']).default('nodemailer').describe('Email service provider'),
    templateEngine: z.enum(['handlebars', 'ejs', 'none']).default('handlebars').describe('Template engine for HTML emails'),
    includeTemplates: z.boolean().default(true).describe('Generate common email templates'),
    queueSupport: z.boolean().default(false).describe('Add Bull queue for async email sending'),
});

const handler = async (args: z.infer<typeof EmailServiceSchema>): Promise<SkillResult> => {
    const { provider, templateEngine, includeTemplates, queueSupport } = args;

    const files: Record<string, string> = {};

    // Email Module
    files['email.module.ts'] = `import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
${queueSupport ? `import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email.processor';` : ''}

@Global()
@Module({
  ${queueSupport ? `imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],` : ''}
  providers: [EmailService${queueSupport ? ', EmailProcessor' : ''}],
  exports: [EmailService],
})
export class EmailModule {}
`;

    // Email Service based on provider
    let serviceCode = '';

    if (provider === 'nodemailer') {
        serviceCode = `import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
${templateEngine === 'handlebars' ? `import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';` : ''}
${queueSupport ? `import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';` : ''}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    ${queueSupport ? `@InjectQueue('email') private emailQueue: Queue,` : ''}
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  ${templateEngine === 'handlebars' ? `
  private compileTemplate(templateName: string, context: Record<string, any>): string {
    const templatePath = path.join(__dirname, 'templates', \`\${templateName}.hbs\`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(context);
  }` : ''}

  async send(options: SendEmailOptions): Promise<boolean> {
    try {
      let html = options.html;

      ${templateEngine === 'handlebars' ? `
      if (options.template && options.context) {
        html = this.compileTemplate(options.template, options.context);
      }` : ''}

      const mailOptions = {
        from: process.env.SMTP_FROM || '"App" <noreply@app.com>',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(\`Email sent to \${options.to}\`);
      return true;
    } catch (error) {
      this.logger.error(\`Failed to send email: \${error.message}\`);
      return false;
    }
  }

  ${queueSupport ? `
  async sendAsync(options: SendEmailOptions): Promise<void> {
    await this.emailQueue.add('send', options, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    this.logger.log(\`Email queued for \${options.to}\`);
  }` : ''}

  // Convenience methods
  async sendWelcome(to: string, name: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Welcome to our platform!',
      template: 'welcome',
      context: { name, year: new Date().getFullYear() },
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Reset your password',
      template: 'password-reset',
      context: { resetUrl, expiresIn: '1 hour' },
    });
  }

  async sendOrderConfirmation(to: string, order: any): Promise<boolean> {
    return this.send({
      to,
      subject: \`Order Confirmation #\${order.id}\`,
      template: 'order-confirmation',
      context: { order },
    });
  }
}
`;
    } else if (provider === 'resend') {
        serviceCode = `import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  react?: React.ReactElement;
}

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(\`Email sent to \${options.to}\`);
      return true;
    } catch (error) {
      this.logger.error(\`Failed to send email: \${error.message}\`);
      return false;
    }
  }
}
`;
    } else {
        serviceCode = `import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    try {
      const msg: any = {
        to: options.to,
        from: process.env.SENDGRID_FROM || 'noreply@app.com',
        subject: options.subject,
      };

      if (options.templateId) {
        msg.templateId = options.templateId;
        msg.dynamicTemplateData = options.dynamicTemplateData;
      } else {
        msg.text = options.text;
        msg.html = options.html;
      }

      await sgMail.send(msg);
      this.logger.log(\`Email sent to \${options.to}\`);
      return true;
    } catch (error) {
      this.logger.error(\`Failed to send email: \${error.message}\`);
      return false;
    }
  }
}
`;
    }

    files['email.service.ts'] = serviceCode;

    // Queue Processor
    if (queueSupport) {
        files['email.processor.ts'] = `import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService, SendEmailOptions } from './email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send')
  async handleSend(job: Job<SendEmailOptions>) {
    this.logger.log(\`Processing email job \${job.id}\`);
    
    const result = await this.emailService.send(job.data);
    
    if (!result) {
      throw new Error('Email sending failed');
    }
    
    return result;
  }
}
`;
    }

    // Templates
    if (includeTemplates && templateEngine === 'handlebars') {
        files['templates/welcome.hbs'] = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, {{name}}! 🎉</h1>
    </div>
    <div class="content">
      <p>Thanks for joining us! We're excited to have you on board.</p>
      <p>Here's what you can do next:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Explore our features</li>
        <li>Connect with the community</li>
      </ul>
      <a href="{{dashboardUrl}}" class="button">Get Started</a>
    </div>
    <div class="footer">
      <p>&copy; {{year}} Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

        files['templates/password-reset.hbs'] = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>We received a request to reset your password.</p>
      <p>Click the button below to create a new password:</p>
      <a href="{{resetUrl}}" class="button">Reset Password</a>
      <div class="warning">
        ⚠️ This link will expire in {{expiresIn}}.
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

        files['templates/order-confirmation.hbs'] = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f1f1f1; }
    .total { font-size: 1.2em; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed! ✓</h1>
      <p>Order #{{order.id}}</p>
    </div>
    <div class="content">
      <p>Thank you for your order!</p>
      <table>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
        </tr>
        {{#each order.items}}
        <tr>
          <td>{{this.name}}</td>
          <td>{{this.quantity}}</td>
          <td>\${{this.price}}</td>
        </tr>
        {{/each}}
        <tr class="total">
          <td colspan="2">Total</td>
          <td>\${{order.total}}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
`;
    }

    return {
        success: true,
        data: files,
        metadata: {
            provider,
            templateEngine,
            queueSupport,
            generatedFiles: Object.keys(files),
        },
    };
};

export const emailServiceSkillDefinition: SkillDefinition<typeof EmailServiceSchema> = {
    name: 'email_service_generator',
    description: 'Generates NestJS email service with Nodemailer/SendGrid/Resend, templates, and optional queue support.',
    parameters: EmailServiceSchema,
    handler,
};
