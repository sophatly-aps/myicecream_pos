"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { useTranslation } from "react-i18next"
import { t } from 'i18next';
import { PencilIcon, TrashIcon } from "lucide-react"

export type Product = {
    id: number
    name: string
    category_id: number
    category_name: string
    unit: string
    base_price: number
    selling_price: number
    image: string | null
    status: string
    has_orders: boolean
}

type ActionsProps = {
    row: Row<Product>
    onEdit: (product: Product) => void
    onDelete: (product: Product) => void
}

// Separate component so hooks can be used if needed in future
function Actions({ row, onEdit, onDelete }: ActionsProps) {

    const t = useTranslation();
    const product = row.original
    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(product)}><PencilIcon /> </Button>
            <Button variant="destructive" size="sm" disabled={product.has_orders} onClick={() => onDelete(product)}><TrashIcon /> </Button>
        </div>
    )
}

export function buildColumns(
    onEdit: (product: Product) => void,
    onDelete: (product: Product) => void,
    currency: string = '$'
): ColumnDef<Product>[] {
    return [
        {
            id: "index",
            header: t('products.no'),
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "image",
            header: t('products.image'),
            cell: ({ row }) => {
                const img = row.getValue<string | null>("image")
                return img
                    ? <img src={img} alt={row.original.name} className="w-12 h-12 object-cover rounded-md border" />
                    : <div className="w-12 h-12 rounded-md border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
            },
        },
        {
            accessorKey: "name",
            header: t('products.product_name'),
        },
        {
            id: "sold",
            header: t('products.sold'),
            cell: ({ row }) => {
                const isSold = row.original.has_orders

                if (!isSold) return null

                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {t('products.sold')} {/* add translation */}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "category_name",
            header: t('products.category'),
        },
        {
            accessorKey: "base_price",
            header: t('products.base_price'),
            cell: ({ row }) => {
                const val = row.getValue<number | null>("base_price")
                return val != null ? `${currency}${Number(val).toFixed(2)}` : <span className="text-gray-400">—</span>
            },
        },
        {
            accessorKey: "selling_price",
            header: t('products.selling_price'),
            cell: ({ row }) => `${currency}${Number(row.getValue<number>("selling_price")).toFixed(2)}`,
        },
        {
            accessorKey: "status",
            header: t('products.status_label'),
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
                        {status === "active" ? t('products.status.active') : t('products.status.inactive')}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            header: t('products.action'),
            cell: ({ row }) => <Actions row={row} onEdit={onEdit} onDelete={onDelete} />,
        },
    ]
}