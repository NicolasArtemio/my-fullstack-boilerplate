import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const ShadcnSchema = z.object({
    componentType: z.enum(["card", "form", "data-table", "modal"]).describe("Type of component to generate"),
    dataFields: z.array(z.string()).describe("List of data fields to include"),
    componentName: z.string().optional().describe("Custom component name (PascalCase)"),
    includeActions: z.boolean().default(true).describe("Include action buttons (edit, delete)"),
    darkMode: z.boolean().default(true).describe("Include dark mode styles"),
});

export const shadcnHandler = async (args: z.infer<typeof ShadcnSchema>): Promise<SkillResult> => {
    const { componentType, dataFields, componentName, includeActions, darkMode } = args;
    const name = componentName || `Generated${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`;

    let code = '';

    switch (componentType) {
        case 'card':
            code = generateCard(name, dataFields, includeActions, darkMode);
            break;
        case 'data-table':
            code = generateDataTable(name, dataFields, includeActions);
            break;
        case 'modal':
            code = generateModal(name, dataFields);
            break;
        case 'form':
            code = generateForm(name, dataFields);
            break;
    }

    return {
        success: true,
        data: code,
        metadata: {
            style: 'shadcn/ui',
            component: componentType,
            generatedName: name
        }
    };
};

function generateCard(name: string, fields: string[], includeActions: boolean, darkMode: boolean): string {
    const fieldItems = fields.map(f => `
          <div className="flex justify-between">
            <span className="text-muted-foreground">${f}</span>
            <span className="font-medium">{data.${f.toLowerCase().replace(/\s/g, '')}}</span>
          </div>`).join('\n');

    return `import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
${includeActions ? `import { Edit, Trash2 } from "lucide-react";` : ''}

interface ${name}Props {
  data: {
    ${fields.map(f => `${f.toLowerCase().replace(/\s/g, '')}: string;`).join('\n    ')}
  };
  ${includeActions ? 'onEdit?: () => void;\n  onDelete?: () => void;' : ''}
}

export function ${name}({ data${includeActions ? ', onEdit, onDelete' : ''} }: ${name}Props) {
  return (
    <Card className="${darkMode ? 'bg-card hover:bg-accent/50 transition-colors' : ''}">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{data.${fields[0]?.toLowerCase().replace(/\s/g, '') || 'title'}}</span>
          <Badge variant="secondary">Active</Badge>
        </CardTitle>
        <CardDescription>Card description</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        ${fieldItems}
      </CardContent>
      ${includeActions ? `<CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </CardFooter>` : ''}
    </Card>
  );
}`;
}

function generateDataTable(name: string, fields: string[], includeActions: boolean): string {
    const columns = fields.map(f => `
  {
    accessorKey: "${f.toLowerCase().replace(/\s/g, '')}",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        ${f}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },`).join('');

    return `import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ${name}Data = {
  id: string;
  ${fields.map(f => `${f.toLowerCase().replace(/\s/g, '')}: string;`).join('\n  ')}
};

export const ${name.toLowerCase()}Columns: ColumnDef<${name}Data>[] = [
  ${columns}
  ${includeActions ? `{
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },` : ''}
];`;
}

function generateModal(name: string, fields: string[]): string {
    const formFields = fields.map(f => `
        <div className="grid gap-2">
          <Label htmlFor="${f.toLowerCase().replace(/\s/g, '')}">${f}</Label>
          <Input id="${f.toLowerCase().replace(/\s/g, '')}" placeholder="Enter ${f.toLowerCase()}" />
        </div>`).join('');

    return `import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ${name}Props {
  trigger?: React.ReactNode;
  onSubmit?: (data: Record<string, string>) => void;
}

export function ${name}({ trigger, onSubmit }: ${name}Props) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    onSubmit?.(data as Record<string, string>);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Open</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>${name.replace(/Modal|Dialog/g, '')}</DialogTitle>
            <DialogDescription>
              Fill in the details below and click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            ${formFields}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}`;
}

function generateForm(name: string, fields: string[]): string {
    const formFields = fields.map(f => `
        <FormField
          control={form.control}
          name="${f.toLowerCase().replace(/\s/g, '')}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>${f}</FormLabel>
              <FormControl>
                <Input placeholder="${f}" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />`).join('');

    const zodFields = fields.map(f =>
        `  ${f.toLowerCase().replace(/\s/g, '')}: z.string().min(1, "${f} is required"),`
    ).join('\n');

    return `import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
${zodFields}
});

type FormValues = z.infer<typeof formSchema>;

interface ${name}Props {
  onSubmit: (values: FormValues) => void;
  defaultValues?: Partial<FormValues>;
  isLoading?: boolean;
}

export function ${name}({ onSubmit, defaultValues, isLoading }: ${name}Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      ${fields.map(f => `${f.toLowerCase().replace(/\s/g, '')}: ""`).join(',\n      ')}
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        ${formFields}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}`;
}

export const shadcnSkillDefinition: SkillDefinition<typeof ShadcnSchema> = {
    name: "apply_shadcn_style",
    description: "Generates fully functional Shadcn UI components (Cards, Dialogs, DataTables, Forms) with dark mode support and actions.",
    parameters: ShadcnSchema,
    handler: shadcnHandler,
};
