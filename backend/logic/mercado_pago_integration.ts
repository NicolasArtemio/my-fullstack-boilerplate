import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const MercadoPagoIntegrationSchema = z.object({
    accessTokenEnvVar: z.string().default('MERCADOPAGO_ACCESS_TOKEN').describe('Environment variable name for the Access Token'),
    webhookPath: z.string().default('/webhooks/mercadopago').describe('Endpoint path for handling IPN/Webhooks'),
    useNestJs: z.boolean().default(true).describe('Generate code tailored for NestJS (Controller/Service)'),
    includeItemsSample: z.boolean().default(true).describe('Include sample items structure in Preference creation'),
});

const handler = async (args: z.infer<typeof MercadoPagoIntegrationSchema>): Promise<SkillResult> => {
    const { accessTokenEnvVar, webhookPath, useNestJs, includeItemsSample } = args;

    // We will generate a Service and a Controller code block if NestJS is selected, 
    // otherwise a generic Class structure.

    const itemsCode = includeItemsSample ? `
      items: [
        {
          id: '1234',
          title: 'Dummy Item',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 100.50
        }
      ],` : 'items: [], // Populate with dynamic items from your cart/order';

    const nestJsCode = `
import { Injectable, Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;

  constructor() {
    // SECURITY: Access Token is loaded from environment variables
    this.client = new MercadoPagoConfig({ accessToken: process.env.${accessTokenEnvVar} || '' });
  }

  /* 
   * Create a Payment Preference 
   * This generates the initialization link for the frontend checkout.
   */
  async createPreference() {
    const preference = new Preference(this.client);

    try {
      const response = await preference.create({
        body: {
          ${itemsCode}
          back_urls: {
            success: 'https://your-site.com/success',
            failure: 'https://your-site.com/failure',
            pending: 'https://your-site.com/pending',
          },
          auto_return: 'approved',
          notification_url: \`\${process.env.API_URL}${webhookPath}\` // WEBHOOK for IPN
        }
      });
      
      return { init_point: response.init_point, preference_id: response.id };
    } catch (error) {
      console.error('Error creating preference:', error);
      throw new BadRequestException('Failed to create payment preference');
    }
  }

  /*
   * Handle Webhook (IPN)
   * Listens for payment updates from Mercado Pago.
   */
  async handleWebhook(query: any) {
    const paymentId = query['data.id'] || query['id'];
    const topic = query['type'] || query['topic'];

    if (topic === 'payment' && paymentId) {
      const payment = new Payment(this.client);
      
      try {
        const paymentData = await payment.get({ id: paymentId });
        
        // TODO: Update your database status here
        console.log('Payment Status:', paymentData.status);
        console.log('Payment ID:', paymentData.id);

        if (paymentData.status === 'approved') {
           // await this.ordersService.markAsPaid(paymentData.external_reference);
        }
        
      } catch (error) {
        console.error('Error fetching payment data:', error);
      }
    }
  }
}

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mpService: MercadoPagoService) {}

  @Post('create-preference')
  async createPreference() {
    return this.mpService.createPreference();
  }

  @Post('${webhookPath.replace(/^\//, '')}') 
  async handleWebhook(@Query() query: any, @Body() body: any) {
    // Mercado Pago creates a mix of query params and body depending on the event type
    return this.mpService.handleWebhook({ ...query, ...body });
  }
}
`;

    const genericCode = `
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';

// Initialize Client
const client = new MercadoPagoConfig({ accessToken: process.env.${accessTokenEnvVar} || '' });

// Create Preference Function
export const createPreference = async () => {
  const preference = new Preference(client);

  const response = await preference.create({
        body: {
          ${itemsCode}
          back_urls: {
            success: 'https://your-site.com/success',
            failure: 'https://your-site.com/failure',
            pending: 'https://your-site.com/pending',
          },
          auto_return: 'approved',
          notification_url: \`\${process.env.API_URL}${webhookPath}\`
        }
  });

  return response;
};

// Webhook Handler Function
export const handleWebhook = async (query: any) => {
    const paymentId = query['data.id'] || query['id'];
    const topic = query['type'] || query['topic'];

    if (topic === 'payment' && paymentId) {
       const payment = new Payment(client);
       const paymentData = await payment.get({ id: paymentId });
       
       return paymentData;
    }
};
`;

    return {
        success: true,
        data: useNestJs ? nestJsCode.trim() : genericCode.trim(),
        metadata: {
            description: "Mercado Pago Integration Code v2",
            type: useNestJs ? "NestJS Module" : "Generic TS",
            sdkVersion: "mercadopago (v2)"
        }
    };
};

export const mercadoPagoIntegrationSkillDefinition: SkillDefinition<typeof MercadoPagoIntegrationSchema> = {
    name: 'generate_mercadopago_integration',
    description: 'Generates robust Mercado Pago integration code (Preferences & Webhooks) using the v2 SDK.',
    parameters: MercadoPagoIntegrationSchema,
    handler,
};
