import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { t } from "i18next";

export type PaySlip = {
    id: number;
    employee_id: number;
    employee?: {
        name: string;
        position?: string;
    };
    month: string;
    base_salary: number;
    total_advance: number;
    absent_days: number;
    absent_deduction: number;
    other_deductions: number;
    net_salary: number;
    status: string;
    created_at: string;
};

export const buildColumns = (
    currency: string,
    onView: (pay_slip: PaySlip) => void,
    onEdit: (pay_slip: PaySlip) => void,
    onDelete: (pay_slip: PaySlip) => void
): ColumnDef<PaySlip>[] => [
        {
            id: "no",
            header: t("payslip.no"),
            cell: ({ row }) => <div className="w-[30px]">{row.index + 1}</div>,
        },
        {
            accessorKey: "employee.name",
            header: t("payslip.employee_name"),
            cell: ({ row }) => {
                const name = row.original.employee?.name || "N/A";
                return <span className="font-medium text-gray-900">{name}</span>;
            },
        },
        {
            accessorKey: "month",
            header: t("payslip.month"),
            cell: ({ row }) => <span>{row.original.month}</span>,
        },
        {
            accessorKey: "base_salary",
            header: t("payslip.gross_salary"),
            cell: ({ row }) => <span>{currency}{Number(row.original.base_salary || 0).toLocaleString('en-US')}</span>,
        },
        {
            id: "total_deductions",
            header: t("payslip.total_deductions"),
            cell: ({ row }) => {
                const advance = Number(row.original.total_advance || 0);
                const absent = Number(row.original.absent_deduction || 0);
                const other = Number(row.original.other_deductions || 0);
                const total = advance + absent + other;
                return <span className="text-red-500">{currency}{total.toLocaleString('en-US')}</span>;
            },
        },
        {
            accessorKey: "net_salary",
            header: t("payslip.net_salary"),
            cell: ({ row }) => <span className="font-bold text-green-600">{currency}{Number(row.original.net_salary || 0).toLocaleString('en-US')}</span>,
        },
        {
            accessorKey: "status",
            header: t("payslip.status_label"),
            cell: ({ row }) => {
                const status = row.original.status as string;
                let bgColor = "bg-gray-100 text-gray-800";
                if (status === "paid") bgColor = "bg-green-100 text-green-800 border-none";
                if (status === "pending") bgColor = "bg-yellow-100 text-yellow-800 border-none";

                return (
                    <Badge className={`uppercase text-[10px] ${bgColor}`}>
                        {t(`payslip.payslip_status.${status}`)}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: t("payslip.action"),
            cell: ({ row }) => {
                const pay_slip = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(pay_slip)}
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                        >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(pay_slip)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">{t("payslip.edit")}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(pay_slip)}
                            className="h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("payslip.delete")}</span>
                        </Button>
                    </div>
                );
            },
        },
    ];
