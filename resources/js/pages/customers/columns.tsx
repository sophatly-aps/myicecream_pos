"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PenIcon, TrashIcon, EyeIcon, CornerDownRightIcon, FileSpreadsheetIcon } from 'lucide-react';
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
}

export interface PaginatedCustomers {
    data: Customer[];
    links: any[];
    from: number;
    to: number;
    total: number;
}

type ActionsProps = {
    row: Row<Customer>
    onView: (customer: Customer) => void
    onEdit: (customer: Customer) => void
    onDelete: (customer: Customer) => void
    onStatement: (customer: Customer) => void
}

// Separate component so hooks can be used if needed in future
function Actions({ row, onView, onEdit, onDelete, onStatement }: ActionsProps) {

    const customer = row.original
    return (
        <div className="flex gap-2">
            {!customer.parent_id && (
                <Button variant="outline" size="sm" onClick={() => onStatement(customer)} title="Report Statement">
                    <FileSpreadsheetIcon className="h-4 w-4 text-green-600" />
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onView(customer)}><EyeIcon className="h-4 w-4" /></Button>
            <Button variant="secondary" size="sm" onClick={() => onEdit(customer)}><PenIcon className="h-4 w-4" /></Button>
            <Button variant="destructive" size="sm" disabled={customer.orders_count > 0} title={
                customer.orders_count > 0
                    ? "Cannot delete"
                    : "Delete customer"
            } onClick={() => {
                if (customer.orders_count > 0) return;
                onDelete(customer)
            }}><TrashIcon className="h-4 w-4" /></Button>
        </div>
    )
}

export function buildColumns(
    onView: (customer: Customer) => void,
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void,
    onStatement: (customer: Customer) => void
): ColumnDef<Customer>[] {
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
            cell: ({ row }) => <Actions row={row} onView={onView} onEdit={onEdit} onDelete={onDelete} onStatement={onStatement} />,
        },
    ]
}