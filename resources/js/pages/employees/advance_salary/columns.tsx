'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    PenIcon,
    SlashSquareIcon,
    SquareSlashIcon,
    TrashIcon,
} from 'lucide-react';
import { t } from 'i18next';
import { router } from '@inertiajs/react';

export interface AdvanceSalary {
    id: number;
    employee_id: string;
    employee_name: string;
    amount: string;
    request_date: string;
    reason: string;
    status: string;
}

export interface PaginatedCustomers {
    data: AdvanceSalary[];
    links: any[];
    from: number;
    to: number;
    total: number;
}

type ActionsProps = {
    row: Row<AdvanceSalary>;
    onEdit: (advanceSalary: AdvanceSalary) => void;
    onDelete: (advanceSalary: AdvanceSalary) => void;
};

// Separate component so hooks can be used if needed in future
function Actions({ row, onEdit, onDelete }: ActionsProps) {
    const advanceSalary = row.original;

    return (
        <div className="flex gap-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(advanceSalary)}
            >
                <PenIcon />
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(advanceSalary)}
            >
                <TrashIcon />
            </Button>
        </div>
    );
}

export function buildColumns(
    onEdit: (advanceSalary: AdvanceSalary) => void,
    onDelete: (advanceSalary: AdvanceSalary) => void,
): ColumnDef<AdvanceSalary>[] {
    return [
        {
            id: 'index',
            header: t('advance_salary.no'),
            cell: ({ row }) => {
                return <span>{row.index + 1}</span>;
            },
        },
        {
            accessorKey: 'employee_name',
            header: t('advance_salary.employee_name'),
        },
        {
            accessorKey: 'amount',
            header: t('advance_salary.amount'),
        },
        {
            accessorKey: 'request_date',
            header: t('advance_salary.request_date'),
        },
        {
            accessorKey: 'reason',
            header: t('advance_salary.reason'),
        },
        {
            accessorKey: 'status',
            header: t('advance_salary.status_label'),
            cell: ({ row }) => {
                const status = row.getValue<string>('status');

                // Define colors/styles for each status
                const statusConfig: Record<string, string> = {
                    pending:
                        'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
                    approved:
                        'bg-green-100 text-green-800 hover:bg-green-200 border-green-200',
                    rejected:
                        'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
                };

                // Define labels/translations for each status
                const statusLabels: Record<string, string> = {
                    pending: t('advance_salary.status.pending'),
                    approved: t('advance_salary.status.approved'),
                    rejected: t('advance_salary.status.rejected'),
                };

                return (
                    <Badge
                        className={
                            statusConfig[status] || 'bg-gray-100 text-gray-800'
                        } // Fallback to gray if status is unknown
                        variant="outline"
                    >
                        {statusLabels[status] || status}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: t('depot.action'),
            cell: ({ row }) => (
                <Actions row={row} onEdit={onEdit} onDelete={onDelete} />
            ),
        },
    ];
}
