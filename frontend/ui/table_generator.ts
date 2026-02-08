import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const TableGeneratorSchema = z.object({
    tableName: z.string().describe('Table component name (PascalCase)'),
    columns: z.array(z.object({
        key: z.string(),
        label: z.string(),
        sortable: z.boolean().default(true),
    })),
    withPagination: z.boolean().default(true),
    withSearch: z.boolean().default(true),
    withRowActions: z.boolean().default(true),
});

const handler = async (args: z.infer<typeof TableGeneratorSchema>): Promise<SkillResult> => {
    const { tableName, columns, withPagination, withSearch, withRowActions } = args;

    const columnDefs = columns.map(col => `
  {
    accessorKey: "${col.key}",
    header: ${col.sortable ? `({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        ${col.label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )` : `"${col.label}"`},
  },`).join('');

    const code = `"use client";
import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type ${tableName}Row = {
  id: string;
  ${columns.map(c => `${c.key}: string;`).join('\n  ')}
};

const columns: ColumnDef<${tableName}Row>[] = [
  ${columnDefs}
  ${withRowActions ? `{
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },` : ''}
];

interface ${tableName}Props {
  data: ${tableName}Row[];
}

export function ${tableName}({ data }: ${tableName}Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ${withPagination ? 'getPaginationRowModel: getPaginationRowModel(),' : ''}
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
  });

  return (
    <div className="space-y-4">
      ${withSearch ? `<Input
        placeholder="Search..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />` : ''}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      ${withPagination ? `<div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>` : ''}
    </div>
  );
}`;

    return {
        success: true,
        data: code,
        metadata: { tableName, columns: columns.length, features: { withPagination, withSearch, withRowActions } },
    };
};

export const tableGeneratorSkillDefinition: SkillDefinition<typeof TableGeneratorSchema> = {
    name: 'table_generator',
    description: 'Generates TanStack Table with sorting, filtering, pagination, and row actions.',
    parameters: TableGeneratorSchema,
    handler,
};
