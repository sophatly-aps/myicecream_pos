'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { t } from 'i18next';

export type Expense = {
    id: number;
    user_id: number;
    expense_date: Date;
    expense_name: string;
    description: string;
    expense_amount: number;
    status: string;
    unit: string;
    expense_method: string;
    due_amount: number;
};

export type settings = {
    currency_symbol?: string;
    [key: string]: any;
};

type ActionsProps = {
    row: Row<Expense>;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
};

// Separate component so hooks can be used if needed in future
function Actions({ row, onEdit, onDelete }: ActionsProps) {
    const expense = row.original;

    return (
        <div className="flex gap-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(expense)}
            >
                {t('expense.edit')}
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(expense)}
            >
                {t('expense.delete')}
            </Button>
        </div>
    );
}

export function buildColumns(
    settings: settings,
    onEdit: (expense: Expense) => void,
    onDelete: (expense: Expense) => void,
): ColumnDef<Expense>[] {
    return [
        {
            id: 'index',
            header: t('expense.no'),
            cell: ({ row }) => row.index + 1,
        },

        {
            accessorKey: 'expense_name',
            header: t('expense.expense_name'),
        },
        {
            accessorKey: 'unit',
            header: t('expense.unit'),
        },
        {
            accessorKey: 'expense_date',
            header: t('expense.expense_date'),
            cell: ({ row }) => {
                const date = new Date(row.getValue('expense_date') as string);
                return date.toLocaleDateString('en-GB');
            },
        },
        {
            accessorKey: 'description',
            header: t('expense.description'),
        },
        {
            accessorKey: 'expense_amount',
            header: t('expense.total_amount'),
            cell: ({ getValue }) =>
                `${settings.currency_symbol}${Number(getValue()).toLocaleString()}`,
        },
        {
            accessorKey: 'expense_method',
            header: t('expense.expense_method_label'),
            cell: ({ row }) => {
                const method = row.getValue<string>('expense_method');
                return (
                    <Badge
                        className={
                            method === 'paid'
                                ? 'border-green-200 bg-green-100 text-green-800 hover:bg-green-200'
                                : 'border-red-200 bg-red-100 text-red-800 hover:bg-red-200'
                        }
                        variant="outline"
                    >
                        {method === 'paid'
                            ? t('expense.expense_method.paid')
                            : t('expense.expense_method.due')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'due_amount',
            header: t('expense.due_amount'),
            cell: ({ getValue }) =>
                `${settings.currency_symbol}${Number(getValue()).toLocaleString()}`,
        },

        {
            accessorKey: 'status',
            header: t('expense.status_label'),
            cell: ({ row }) => {
                const status = row.getValue<string>('status');
                return (
                    <Badge
                        className={
                            status === 'active'
                                ? 'border-green-200 bg-green-100 text-green-800 hover:bg-green-200'
                                : 'border-red-200 bg-red-100 text-red-800 hover:bg-red-200'
                        }
                        variant="outline"
                    >
                        {status === 'active'
                            ? t('expense.status.active')
                            : t('expense.status.inactive')}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: t('expense.action'),
            cell: ({ row }) => (
                <Actions row={row} onEdit={onEdit} onDelete={onDelete} />
            ),
        },
    ];
}
