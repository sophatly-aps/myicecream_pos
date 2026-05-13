"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PenIcon, TrashIcon } from 'lucide-react';
import { t } from "i18next";


export interface Customer {
    id: number;
    name: string;
    phone: string;
    address?: string;
    status: string;
    other_info: string;
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
    onEdit: (customer: Customer) => void
    onDelete: (customer: Customer) => void
}

// Separate component so hooks can be used if needed in future
function Actions({ row, onEdit, onDelete }: ActionsProps) {

    const customer = row.original
    return (
        <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onEdit(customer)}><PenIcon /></Button>
            <Button variant="destructive" size="sm" disabled={customer.orders_count > 0} title={
                customer.orders_count > 0
                    ? "Cannot delete"
                    : "Delete customer"
            } onClick={() => {
                if (customer.orders_count > 0) return;
                onDelete(customer)
            }}><TrashIcon /></Button>
        </div>
    )
}

export function buildColumns(
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void
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
            accessorKey: "other_info",
            header: t('depot.other_info'),
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
            cell: ({ row }) => <Actions row={row} onEdit={onEdit} onDelete={onDelete} />,
        },
    ]
}