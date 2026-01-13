'use client';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWebsiteSuggestions } from '@/context/WebsiteSuggestionsContext';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FullDynamicZodType } from '@/lib/zod.utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
    staticDesktopComparisonColumns,
    staticMobileComparisonColumns,
    staticSharedComparisonColumns,
} from '@/constants/comparison-table-config.const';
import { StaticZodFields } from '@/models/website-comparison.model';
import { useIsMobile } from '@/hooks/use-mobile';

const cellClassName = 'px-6 py-4';
const headerClassName = 'px-6 py-2';

export function WebsiteComparisonTable() {
    const { comparisonColumns: columns, comparisonRows: rows, isLoadingComparison } = useWebsiteSuggestions();

    const [sorting, setSorting] = useState<SortingState>([]);

    const dynamicColumns = useMemo<ColumnDef<FullDynamicZodType>[]>(
        () =>
            columns
                .filter((col) => !Object.keys(StaticZodFields).includes(col.zodKey))
                .map(
                    (col): ColumnDef<FullDynamicZodType> => ({
                        id: col.id,
                        accessorFn: (row) => row[col.zodKey],
                        header: () => (
                            <Button
                                variant='ghost'
                                onClick={() =>
                                    setSorting((prev) =>
                                        prev[0]?.id === col.id
                                            ? [{ id: col.id, desc: !prev[0].desc }]
                                            : [{ id: col.id, desc: false }],
                                    )
                                }
                                className='p-0 text-left hover:bg-transparent'
                            >
                                <div className='flex items-center gap-2'>
                                    {col.header}
                                    <ArrowUpDown className='w-4 h-4' />
                                </div>
                            </Button>
                        ),
                        cell: (info) => {
                            const value = info.getValue();

                            if (typeof value === 'boolean') {
                                return (
                                    <span
                                        className={cn(
                                            'px-2 py-1 rounded text-xs font-medium',
                                            value
                                                ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
                                        )}
                                    >
                                        {value ? 'Yes' : 'No'}
                                    </span>
                                );
                            }

                            if (value == null || value === '') {
                                return <span className='text-gray-400 italic'>—</span>;
                            }

                            return String(value);
                        },
                        enablePinning: true,
                    }),
                ),
        [columns],
    );

    const isMobile = useIsMobile();

    const columnPinning = useMemo(() => {
        return isMobile ? { left: ['favicon'] } : { left: ['favicon', 'title'] };
    }, [isMobile]);

    const staticColumns = useMemo<ColumnDef<FullDynamicZodType>[]>(
        () =>
            isMobile
                ? [...staticMobileComparisonColumns, ...staticSharedComparisonColumns]
                : [...staticDesktopComparisonColumns, ...staticSharedComparisonColumns],
        [isMobile],
    );

    const table = useReactTable({
        data: rows,
        columns: [...staticColumns, ...dynamicColumns],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableColumnPinning: true,
        state: { sorting, columnPinning },
        onSortingChange: setSorting,
    });

    const columnCount = Math.max(5, columns.length || 0);

    return (
        <div className='space-y-4 bg-background rounded-lg shadow-md border border-border overflow-auto'>
            {isLoadingComparison && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            {Array.from({ length: columnCount }).map((_, idx) => (
                                <TableHead key={`skel-head-${idx}`}>
                                    <Skeleton className={cn('h-4 w-24', cellClassName)} />
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, rowIdx) => (
                            <TableRow key={`skel-row-${rowIdx}`}>
                                {Array.from({ length: columnCount }).map((_, colIdx) => (
                                    <TableCell key={`skel-cell-${rowIdx}-${colIdx}`} className={headerClassName}>
                                        <Skeleton className={cn('h-4 w-full', cellClassName)} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {!isLoadingComparison && columns.length > 0 && rows.length > 0 && (
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className={cn(headerClassName)}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className={'px-6 py-2'}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className={cn(
                                            cell.column.getIsPinned() === 'left'
                                                ? 'sticky left-0 z-10 bg-background'
                                                : '',
                                            cell.column.columnDef.meta?.className,
                                            cellClassName,
                                        )}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
