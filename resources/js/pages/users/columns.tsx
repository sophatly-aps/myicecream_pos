"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PenIcon, TrashIcon } from 'lucide-react';
import { t } from 'i18next';


export type User = {
    id: number
    name: string
    email: string
    role: string
    status: string
    photo?: string
    roles?: {
        name: string;
    }[];
}

type ActionsProps = {
    row: Row<User>
    onEdit: (user: User) => void
    onDelete: (user: User) => void
}

// Separate component so hooks can be used if needed in future
function Actions({ row, onEdit, onDelete }: ActionsProps) {
    const user = row.original
    return (
        <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onEdit(user)}><PenIcon /></Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(user)}><TrashIcon /></Button>
        </div>
    )
}

export function buildColumns(
    onEdit: (user: User) => void,
    onDelete: (user: User) => void
): ColumnDef<User>[] {
    return [
        {
            id: "index",
            header: t('user.no'),
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "photo",
            header: t('user.photo'),
            cell: ({ row }) => {
                const photo = row.original.photo;

                return (
                    <div className="flex items-center">
                        <img
                            src={photo ? `/storage/${photo}` : "/default-avatar.png"}
                            alt="user"
                            className="w-10 h-10 rounded-full object-cover border"
                        />
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: t('user.name'),
        },
        {
            accessorKey: "email",
            header: t('user.email'),
        },

        {
            accessorKey: "role",
            header: t('user.role'),
            cell: ({ row }) => {
                const role = row.original.roles?.[0]?.name || row.original.role;
                const roleColors: Record<string, string> = {
                    admin: "bg-red-100 text-red-700 border-red-200",
                    cashier: "bg-blue-100 text-blue-700 border-blue-200",
                    user: "bg-gray-100 text-gray-700 border-gray-200",
                };

                return (
                    <Badge className={roleColors[role as string] || "bg-gray-100"}>
                        {role}
                    </Badge>
                );
            },
        },

        {
            accessorKey: "status",
            header: t('user.status'),
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
                        {status === "active" ? "Active" : "Inactive"}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            header: t('user.action'),
            cell: ({ row }) => <Actions row={row} onEdit={onEdit} onDelete={onDelete} />,
        },
    ]
}