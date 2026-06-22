import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from 'i18next';

export type Absence = {
    id: string;
    employee_id: string;
    employee_name: string;
    month: string;
    absent_days: number;
    reason: string;
};

export const buildColumns = (
    onEdit: (absence: Absence) => void,
    onDelete: (absence: Absence) => void,
): ColumnDef<Absence>[] => [
    {
        id: 'index',
        header: t('absence.no'),
        cell: ({ row }) => {
            return <span>{row.index + 1}</span>;
        },
    },
    {
        accessorKey: 'employee_name',
        header: t('absence.employee_name'),
    },
    {
        accessorKey: 'month',
        header: t('absence.month'),
    },
    {
        accessorKey: 'absent_days',
        header: t('absence.absence_day'),
    },
    {
        accessorKey: 'reason',
        header: t('absence.reason'),
    },
    {
        id: 'actions',
        header: t('absence.action'),
        cell: ({ row }) => {
            const absence = row.original;
            return (
                <div className="flex justify-center gap-2 pr-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(absence)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => onDelete(absence)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
    },
];
