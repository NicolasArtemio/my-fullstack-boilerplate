import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const FormFactorySchema = z.object({
    fields: z.array(z.object({
        name: z.string(),
        type: z.enum(["text", "number", "email", "select"]),
        label: z.string()
    })).describe('List of form fields to generate'),
    submitEndpoint: z.string().describe('API endpoint where the form submits data')
});

const handler = async (args: z.infer<typeof FormFactorySchema>): Promise<SkillResult> => {
    const { fields, submitEndpoint } = args;

    // Constructing the Zod validation schema string
    const zodSchemaFields = fields.map(field => {
        switch (field.type) {
            case 'email': return `  ${field.name}: z.string().email({ message: "Invalid email address" }),`;
            case 'number': return `  ${field.name}: z.coerce.number().min(0, { message: "${field.label} must be positive" }),`;
            default: return `  ${field.name}: z.string().min(2, { message: "${field.label} must be at least 2 characters" }),`;
        }
    }).join('\n');

    const formSchemaCode = `const formSchema = z.object({\n${zodSchemaFields}\n});`;

    // Constructing the Form JSX
    const formFieldsJsx = fields.map(field => `
        <FormField
          control={form.control}
          name="${field.name}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>${field.label}</FormLabel>
              <FormControl>
                ${field.type === 'select'
            ? `<Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ${field.label}" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option1">Option 1</SelectItem>
                        </SelectContent>
                       </Select>`
            : `<Input type="${field.type}" placeholder="${field.label}" {...field} />`
        }
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />`).join('\n');

    const fullComponent = `
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

${formSchemaCode}

export function GeneratedForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ${fields.map(f => `${f.name}: ""`).join(',\n      ')}
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Submitting to ${submitEndpoint}", values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        ${formFieldsJsx}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
`;

    return {
        success: true,
        data: fullComponent,
        metadata: {
            generatedFields: fields.length,
            validation: 'zod'
        }
    };
};

export const formFactorySkillDefinition: SkillDefinition<typeof FormFactorySchema> = {
    name: 'form_factory',
    description: 'Generates robust forms using Shadcn UI components and Zod validation automatically.',
    parameters: FormFactorySchema,
    handler,
};
