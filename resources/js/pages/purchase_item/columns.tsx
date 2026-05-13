"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PenIcon, TrashIcon } from 'lucide-react';
import { t } from 'i18next';


export type PurchaseItem = {
    id: number
    supplier_id: number
    name: string
    unit: string
    price: number
    image: string | null
}

export type Supplier = {
    id: number
    name: string
}

type ActionsProps = {
    row: Row<PurchaseItem>
    onEdit: (purchaseItem: PurchaseItem) => void
    onDelete: (purchaseItem: PurchaseItem) => void
}

// Separate component so hooks can be used if needed in future
function Actions({ row, onEdit, onDelete }: ActionsProps) {
    const purchaseItem = row.original
    return (
        <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onEdit(purchaseItem)}><PenIcon /></Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(purchaseItem)}><TrashIcon /></Button>
        </div>
    )
}

export function buildColumns(
    onEdit: (purchaseItem: PurchaseItem) => void,
    onDelete: (purchaseItem: PurchaseItem) => void
): ColumnDef<PurchaseItem>[] {
    return [
        {
            id: "index",
            header: t('purchase_item.no'),
            cell: ({ row }) => {
                const index = row.index + 1
                return <span>{index}</span>
            }
        },
        {
            accessorKey: "image",
            header: t('purchase_item.image'),
            cell: ({ row }) => {
                const img = row.getValue<string | null>("image")
                return img
                    ? <img src={img} alt={row.original.name} className="w-12 h-12 object-cover rounded-md border" />
                    : <div className="w-12 h-12 rounded-md border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
            },
        },
        {
            accessorKey: "supplier_name",
            header: t('purchase_item.supplier'),
        },
        {
            accessorKey: "name",
            header: t('purchase_item.name'),
        },
        {
            accessorKey: "unit",
            header: t('purchase_item.unit'),
        },
        {
            accessorKey: "price",
            header: t('purchase_item.price'),
            cell: ({ row }) => {
                const val = row.getValue<number | null>("price")
                return val != null ? `${Number(val).toFixed(2)}` : <span className="text-gray-400">—</span>
            },
        },
        {
            id: "actions",
            header: t('purchase_item.action'),
            cell: ({ row }) => <Actions row={row} onEdit={onEdit} onDelete={onDelete} />,
        },
    ]
}