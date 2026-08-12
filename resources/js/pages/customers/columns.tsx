"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    PenIcon,
    TrashIcon,
    EyeIcon,
    CornerDownRightIcon,
    FileSpreadsheetIcon,
    DollarSignIcon,
    HistoryIcon
} from 'lucide-react';
import { t } from "i18next";

export interface Customer {
    id: number;
    parent_id?: number | null;
    parent?: { id: number, name: string } | null;
    sub_customers?: Customer[];
    name: string;
    phone: string;
    address?: string;
    status: string;
    other_info: string;
    start_date?: string | null;
    orders_count: number;
    rent_amount?: number | string;
    rent_due_date?: string | null;
    last_paid_date?: string | null;
}

export interface PaginatedCustomers {
    data: Customer[];
    links: any[];
    from: number;
    to: number;
    total: number;
}

export interface Settings {
    currency_symbol?: string;
    [key: string]: any;
}

type ActionsProps = {
    row: Row<Customer>
    onView: (customer: Customer) => void
    onEdit: (customer: Customer) => void
    onDelete: (customer: Customer) => void
    onStatement: (customer: Customer) => void
    onPayRent: (customer: Customer) => void
    onViewHistory: (customer: Customer) => void
    settings: Settings
}

function Actions({
    row,
    onView,
    onEdit,
    onDelete,
    onStatement,
    onPayRent,
    onViewHistory,
    settings
}: ActionsProps) {
    const customer = row.original
    const rentDueDate = (customer as any).rent_due_date;
    const isRentDue = rentDueDate ? new Date(rentDueDate) < new Date() : false;
    const hasRent = (customer as any).rent_amount && Number((customer as any).rent_amount) > 0;

    return (
        <div className="flex gap-2">

            <Button
                variant="outline"
                size="sm"
                onClick={() => onView(customer)}
                title="View Details"
            >
                <EyeIcon className="h-4 w-4" />
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(customer)}
                title="Edit Customer"
            >
                <PenIcon className="h-4 w-4" />
            </Button>

            {/* View Rent History Button - Only for parent customers with rent */}
            {!customer.parent_id && hasRent && onViewHistory && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewHistory(customer)}
                    title="មើលប្រវត្តិបង់"
                    className="bg-purple-50 border-purple-300 hover:bg-purple-100"
                >
                    <HistoryIcon className="h-4 w-4 text-purple-600" />
                </Button>
            )}

            {/* Pay Rent Button - Only for parent customers with rent */}
            {!customer.parent_id && hasRent && onPayRent && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPayRent(customer)}
                    className={isRentDue ? "bg-red-50 border-red-300 hover:bg-red-100" : "bg-blue-50 border-blue-300 hover:bg-blue-100"}
                    title={isRentDue ? "Rent is overdue - Pay now!" : "បង់ថ្លៃផ្ទះ"}
                >
                    <DollarSignIcon className={`h-4 w-4 ${isRentDue ? "text-red-600" : "text-blue-600"}`} />
                </Button>
            )}

            <Button
                variant="destructive"
                size="sm"
                disabled={customer.orders_count > 0}
                title={
                    customer.orders_count > 0
                        ? "Cannot delete"
                        : "Delete customer"
                }
                onClick={() => {
                    if (customer.orders_count > 0) return;
                    onDelete(customer)
                }}
            >
                <TrashIcon className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function buildColumns(
    onView: (customer: Customer) => void,
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void,
    onStatement: (customer: Customer) => void,
    onPayRent: (customer: Customer) => void,
    onViewHistory: (customer: Customer) => void,
    settings: { currency_symbol?: string }
): ColumnDef<Customer>[] {

    function formatCurrency(amount: number | string | null | undefined, currencySymbol: string = '$'): string {
        if (!amount) return '-';
        const numAmount = Number(amount);
        if (isNaN(numAmount)) return '-';
        const formattedAmount = numAmount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return `${currencySymbol}${formattedAmount}`;
    }

    return [
        {
            id: "index",
            header: t('depot.no'),
            cell: ({ row }) => {
                return <span>{row.index + 1}</span>
            }
        },
        {
            accessorKey: "name",
            header: t('depot.depot_name'),
            cell: ({ row }) => {
                const isSub = !!row.original.parent_id;
                return (
                    <div className="flex items-center gap-2">
                        {isSub && <CornerDownRightIcon className="h-4 w-4 text-gray-400" />}
                        <span>{row.original.name}</span>
                        {isSub && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1 ml-1 bg-gray-100 text-gray-600">
                                Sub
                            </Badge>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "phone",
            header: t('depot.phone'),
        },
        {
            accessorKey: "address",
            header: t('depot.address'),
        },
        {
            accessorKey: "parent.name",
            header: "ដេប៉ូមេ",
        },
        {
            accessorKey: "other_info",
            header: t('depot.other_info'),
        },
        {
            accessorKey: "start_date",
            header: t('depot.start_date', { defaultValue: 'Start Date' }),
            cell: ({ row }) => {
                const date = row.getValue<string>("start_date");
                return date ? new Date(date).toLocaleDateString('en-GB') : '-';
            }
        },
        {
            accessorKey: "rent_due_date",
            header: t('depot.rent_due_date', { defaultValue: 'Rent Due Date' }),
            cell: ({ row }) => {
                const dateStr = (row.original as any).rent_due_date;
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = date.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isAlert = diffDays <= 5;

                return (
                    <div className="flex items-center gap-2">
                        <span>{date.toLocaleDateString('en-GB')}</span>
                        {isAlert && (
                            <Badge variant="destructive" className="text-[10px] h-5 px-1 bg-red-500 hover:bg-red-600">
                                {diffDays < 0 ? 'ដល់ថ្ងៃបង់' : diffDays === 0 ? 'ថ្ងៃនេះ' : `${diffDays} ថ្ងៃ`}
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: "rent_amount",
            header: t('depot.rent_amount', { defaultValue: 'Rent Amount' }),
            cell: ({ row }) => {
                const amount = (row.original as any).rent_amount;
                const currencySymbol = settings?.currency_symbol || '$';
                return formatCurrency(amount, currencySymbol);
            }
        },
        {
            accessorKey: "last_paid_date",
            header: "ថ្ងៃបង់ថ្លៃចុងក្រោយ",
            cell: ({ row }) => {
                const dateStr = (row.original as any).last_paid_date;
                if (!dateStr) return '-';
                return new Date(dateStr).toLocaleDateString('en-GB');
            }
        },
        {
            accessorKey: "status",
            header: t('depot.status_label'),
            cell: ({ row }) => {
                const status = row.getValue<string>("status")
                return (
                    <Badge
                        className={
                            status === "active"
                                ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                        }
                        variant="outline"
                    >
                        {status === "active" ? t('depot.status.active') : t('depot.status.inactive')}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            header: t('depot.action'),
            cell: ({ row }) => (
                <Actions
                    row={row}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatement={onStatement}
                    onPayRent={onPayRent}
                    onViewHistory={onViewHistory}
                    settings={settings}
                />
            ),
        },
    ]
}