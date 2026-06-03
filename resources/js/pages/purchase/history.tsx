import React, { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    ColumnDef,
} from '@tanstack/react-table';
import {
    Trash,
    Eye,
    Pencil,
    RotateCcw,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useTranslation } from 'react-i18next';

type Purchase = {
    id: number;
    purchase_no: string;
    purchase_date: string;
    total_amount: number;
    purchase_status: string;
    purchase_method: string;
    details?: any[];
};

export default function PurchaseHistory({ currency, purchase_items }: any) {
    const { t } = useTranslation();

    const [data, setData] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(false);

    const [mode, setMode] = useState<'view' | 'edit'>('view');

    const [saving, setSaving] = useState(false);

    const [filter, setFilter] = useState('all');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);

    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);

    const [alertAction, setAlertAction] = useState<
        'restore' | 'force_delete' | 'trash' | null
    >(null);
    const [alertPurchaseId, setAlertPurchaseId] = useState<number | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>(
        {},
    );

    const toggleRow = (id: number) => {
        setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const openAlert = (
        action: 'restore' | 'force_delete' | 'trash',
        id: number,
    ) => {
        setAlertAction(action);
        setAlertPurchaseId(id);
        setIsAlertOpen(true);
    };

    const handleAlertConfirm = async () => {
        if (!alertPurchaseId || !alertAction) return;

        setIsAlertOpen(false); // close modal immediately for better UX

        try {
            if (alertAction === 'trash') {
                await axios.delete(
                    route('purchase-history.destroy', alertPurchaseId),
                );
            } else if (alertAction === 'restore') {
                await axios.post(
                    route('purchase-history.restore', alertPurchaseId),
                );
            } else if (alertAction === 'force_delete') {
                await axios.delete(
                    route('purchase-history.force', alertPurchaseId),
                );
            }
            fetchData();
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    // ========================
    // FETCH DATA
    // ========================
    const fetchData = async () => {
        setLoading(true);

        try {
            const res = await axios.get(route('purchase-data'), {
                params: { filter, from, to, page },
            });

            setData(res.data.data);

            console.log(res.data.data);

            setMeta(res.data.meta);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter, page]);

    const fetchPurchaseDetail = async (id: number) => {
        try {
            const res = await axios.get(route('purchase-history.show', id), {
                headers: { Accept: 'application/json' },
            });

            // ✅ FIX HERE
            setSelectedPurchase(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const calculateTotal = () => {
        if (!selectedPurchase?.details) return 0;

        return selectedPurchase.details.reduce((sum: number, item: any) => {
            return sum + Number(item.qty) * Number(item.price);
        }, 0);
    };

    const finalTotal = () => {
        const sub = calculateTotal();

        const transport = Number(selectedPurchase?.transport_fee || 0);
        const tax = Number(selectedPurchase?.tax_amount || 0);
        const discount = Number(selectedPurchase?.discount_amount || 0);

        return sub + transport + tax - discount;
    };

    // ========================
    // TABLE COLUMNS
    // ========================
    const columns: ColumnDef<Purchase>[] = [
        {
            id: 'index',
            header: t('purchase_history.no'),
            cell: ({ row }) => {
                const isExpanded = expandedRows[row.original.id];
                return (
                    <div
                        className="flex cursor-pointer items-center gap-2 font-bold text-indigo-600 select-none"
                        onClick={() => toggleRow(row.original.id)}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        <span>{row.index + 1}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'purchase_no',
            header: t('purchase_history.invoice_no'),
        },
        {
            accessorKey: 'purchase_date',
            header: t('purchase_history.purchase_date'),
            cell: ({ getValue }) => {
                const date = new Date(getValue() as string);

                return date.toLocaleDateString('en-GB');
            },
        },
        {
            accessorKey: 'total_amount',
            header: t('purchase_history.total_amount'),
            cell: ({ getValue }) =>
                `${currency} ${Number(getValue()).toLocaleString()}`,
        },
        {
            accessorKey: 'purchase_method',
            header: t('purchase.payment_method_label'),
            cell: ({ getValue }) => (
                <span className="rounded border-none bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-800 uppercase">
                    {t(
                        `purchase.payment_method_text.${(getValue() as string) || 'N/A'}`,
                        (getValue() as string) || 'N/A',
                    )}
                </span>
            ),
        },
        {
            accessorKey: 'purchase_status',
            header: t('purchase.purchase_status_label'),
            cell: ({ row }) => {
                const status = row.getValue<string>('purchase_status');

                let className =
                    'border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200';

                if (status === 'paid') {
                    className =
                        'border-green-200 bg-green-100 text-green-800 hover:bg-green-200';
                } else if (status === 'partial') {
                    className =
                        'border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
                } else if (status === 'due') {
                    className =
                        'border-red-200 bg-red-100 text-red-800 hover:bg-red-200';
                }

                return (
                    <Badge className={className} variant="outline">
                        {t(
                            `purchase.purchase_status.${status || 'N/A'}`,
                            status?.toUpperCase() || 'N/A',
                        )}
                    </Badge>
                );
            },
        },

        // ACTIONS COLUMN
        {
            id: 'actions',
            header: t('purchase_history.action'),
            cell: ({ row }) => {
                const purchase = row.original;

                return (
                    <div className="flex items-center gap-2">
                        {filter === 'trash' ? (
                            <>
                                {/* RESTORE */}
                                <button
                                    onClick={() =>
                                        openAlert('restore', purchase.id)
                                    }
                                    className="rounded-full bg-green-600 p-2 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-100 hover:text-green-600 hover:shadow-md"
                                    title="Restore"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </button>

                                {/* FORCE DELETE */}
                                <button
                                    onClick={() =>
                                        openAlert('force_delete', purchase.id)
                                    }
                                    className="rounded-full bg-red-800 p-2 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100 hover:text-red-800 hover:shadow-md"
                                    title="Delete Permanently"
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                {/* VIEW */}
                                <button
                                    onClick={async () => {
                                        setMode('view');
                                        setShowViewDialog(true); // open immediately
                                        await fetchPurchaseDetail(purchase.id);
                                    }}
                                    className="rounded-full bg-blue-600 p-2 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-100 hover:text-indigo-600 hover:shadow-md"
                                    title="View"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>

                                {/* EDIT */}
                                <button
                                    onClick={async () => {
                                        setMode('edit');
                                        await fetchPurchaseDetail(purchase.id);
                                        setShowViewDialog(true);
                                    }}
                                    className="rounded-full bg-yellow-600 p-2 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-100 hover:text-blue-600 hover:shadow-md"
                                    title="Edit"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>

                                {/* DELETE */}
                                <button
                                    onClick={() =>
                                        openAlert('trash', purchase.id)
                                    }
                                    className="rounded-full bg-red-600 p-2 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100 hover:text-red-600 hover:shadow-md"
                                    title="Move to Trash"
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // ========================
    // APPLY CUSTOM FILTER
    // ========================
    const applyCustom = () => {
        setFilter('custom');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* ================= SIDEBAR ================= */}
            <div className="w-72 space-y-3 border-r bg-white p-4">
                <h2 className="text-lg font-bold">
                    {t('purchase_history.title')}
                </h2>

                <button
                    className={`w-full rounded p-2 ${
                        filter === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100'
                    }`}
                    onClick={() => setFilter('all')}
                >
                    {t('purchase_history.all')}
                </button>

                <button
                    className={`w-full rounded p-2 ${
                        filter === 'today'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100'
                    }`}
                    onClick={() => setFilter('today')}
                >
                    {t('purchase_history.today')}
                </button>

                <button
                    className={`w-full rounded p-2 ${
                        filter === 'last_week'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100'
                    }`}
                    onClick={() => setFilter('last_week')}
                >
                    {t('purchase_history.last_week')}
                </button>

                <button
                    className={`w-full rounded p-2 ${
                        filter === 'last_month'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100'
                    }`}
                    onClick={() => setFilter('last_month')}
                >
                    {t('purchase_history.last_month')}
                </button>

                <button
                    className={`w-full rounded p-2 ${
                        filter === 'this_month'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100'
                    }`}
                    onClick={() => setFilter('this_month')}
                >
                    {t('purchase_history.this_month')}
                </button>

                {/* ================= CUSTOM DATE ================= */}
                <div className="space-y-2 border-t pt-4">
                    <p className="text-xs font-bold text-gray-500">
                        {t('purchase_history.custom')}
                    </p>

                    <input
                        type="date"
                        className="w-full rounded border p-2"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />

                    <input
                        type="date"
                        className="w-full rounded border p-2"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />

                    <button
                        onClick={applyCustom}
                        className="w-full rounded bg-black p-2 text-white"
                    >
                        {t('purchase_history.apply')}
                    </button>
                </div>

                <button
                    className={`w-full rounded p-2 ${filter === 'trash' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setFilter('trash')}
                >
                    {t('purchase_history.trash')}
                </button>
            </div>

            {/* ================= TABLE ================= */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="py-10 text-center">
                        {t('purchase_history.loading')}
                    </div>
                ) : (
                    <table className="w-full overflow-hidden rounded-lg border bg-white">
                        {/* HEADER */}
                        <thead className="bg-gray-100">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="border-b p-3 text-left"
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        {/* BODY */}
                        <tbody>
                            {table.getRowModel().rows.length === 0 ? (
                                <tr
                                    className={
                                        filter === 'trash'
                                            ? 'bg-red-50 text-gray-500'
                                            : ''
                                    }
                                >
                                    <td
                                        className="p-4 text-center text-gray-500"
                                        colSpan={5}
                                    >
                                        {t('purchase_history.no_data_found')}
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <Fragment key={row.id}>
                                        <tr className="hover:bg-gray-50">
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className="border-b p-3"
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </td>
                                                ))}
                                        </tr>
                                        {expandedRows[row.original.id] && (
                                            <tr className="border-b bg-gray-50">
                                                <td
                                                    colSpan={5}
                                                    className="bg-gray-100 p-4"
                                                >
                                                    <table className="w-full overflow-hidden rounded border bg-white text-sm shadow-sm">
                                                        <thead className="bg-gray-200 text-gray-700">
                                                            <tr>
                                                                <th className="border-b p-2 text-left">
                                                                    {t(
                                                                        'purchase_history.item',
                                                                    )}
                                                                </th>
                                                                <th className="border-b p-2 text-center">
                                                                    {t(
                                                                        'purchase_history.qty',
                                                                    )}
                                                                </th>
                                                                <th className="border-b p-2 text-right">
                                                                    {t(
                                                                        'purchase_history.price',
                                                                    )}
                                                                </th>
                                                                <th className="border-b p-2 text-right">
                                                                    {t(
                                                                        'purchase_history.amount',
                                                                    )}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {row.original.details?.map(
                                                                (
                                                                    detail: any,
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            detail.id
                                                                        }
                                                                        className="border-t hover:bg-gray-50"
                                                                    >
                                                                        <td className="p-2 font-medium">
                                                                            {
                                                                                detail
                                                                                    .purchase_item
                                                                                    ?.name
                                                                            }
                                                                        </td>
                                                                        <td className="p-2 text-center">
                                                                            {
                                                                                detail.qty
                                                                            }{' '}
                                                                            {
                                                                                detail.unit
                                                                            }
                                                                        </td>
                                                                        <td className="p-2 text-right font-semibold text-indigo-700">
                                                                            {
                                                                                currency
                                                                            }
                                                                            {Number(
                                                                                detail.price,
                                                                            ).toLocaleString()}
                                                                        </td>
                                                                        <td className="p-2 text-right font-bold">
                                                                            {
                                                                                currency
                                                                            }
                                                                            {(
                                                                                Number(
                                                                                    detail.qty,
                                                                                ) *
                                                                                Number(
                                                                                    detail.price,
                                                                                )
                                                                            ).toLocaleString()}
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                            {(!row.original
                                                                .details ||
                                                                row.original
                                                                    .details
                                                                    .length ===
                                                                    0) && (
                                                                <tr>
                                                                    <td
                                                                        colSpan={
                                                                            4
                                                                        }
                                                                        className="p-4 text-center text-gray-500"
                                                                    >
                                                                        {t(
                                                                            'purchase_history.no_data_found',
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50"
                    >
                        {t('purchase_history.previous')}
                    </button>

                    <span>
                        {t('purchase_history.page')} {meta?.current_page || 1}{' '}
                        {t('purchase_history.of')} {meta?.last_page || 1}
                    </span>

                    <button
                        disabled={page === meta?.last_page}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50"
                    >
                        {t('purchase_history.next')}
                    </button>
                </div>
            </div>

            {/* ✅ DIALOG MUST BE HERE (NOT INSIDE TABLE) */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-4xl overflow-hidden rounded-xl p-0">
                    {selectedPurchase && (
                        <div className="bg-white">
                            {/* ================= HEADER ================= */}
                            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">
                                            {mode === 'edit'
                                                ? t('purchase.edit_purchase')
                                                : t(
                                                      'purchase.purchase_invoice',
                                                  )}
                                        </h2>
                                        <p className="text-sm opacity-90">
                                            #{selectedPurchase.purchase_no}
                                        </p>
                                    </div>

                                    <div className="text-right text-sm">
                                        <p>
                                            {t(
                                                'purchase_history.purchase_date',
                                            )}
                                        </p>
                                        {mode === 'edit' ? (
                                            <input
                                                type="date"
                                                value={
                                                    selectedPurchase.purchase_date
                                                        ? selectedPurchase.purchase_date.split(
                                                              'T',
                                                          )[0]
                                                        : ''
                                                }
                                                onChange={(e) =>
                                                    setSelectedPurchase({
                                                        ...selectedPurchase,
                                                        purchase_date:
                                                            e.target.value,
                                                    })
                                                }
                                                className="mt-1 rounded border p-1 text-black"
                                            />
                                        ) : (
                                            <p className="font-semibold">
                                                {new Date(
                                                    selectedPurchase.purchase_date,
                                                ).toLocaleDateString('km-KH', {
                                                    day: '2-digit',
                                                    year: 'numeric',
                                                    month: 'short',
                                                })}
                                            </p>
                                        )}
                                        {mode === 'edit' ? (
                                            <div className="mt-2 flex justify-end gap-2 text-black">
                                                <select
                                                    value={
                                                        selectedPurchase.purchase_method ||
                                                        'cash'
                                                    }
                                                    onChange={(e) =>
                                                        setSelectedPurchase({
                                                            ...selectedPurchase,
                                                            purchase_method:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="rounded border p-1"
                                                >
                                                    <option value="cash">
                                                        {t(
                                                            'purchase.payment_method_text.cash',
                                                        )}
                                                    </option>
                                                    <option value="aba">
                                                        {t(
                                                            'purchase.payment_method_text.aba',
                                                        )}
                                                    </option>
                                                    <option value="wing">
                                                        {t(
                                                            'purchase.payment_method_text.wing',
                                                        )}
                                                    </option>
                                                </select>
                                                <select
                                                    value={
                                                        selectedPurchase.purchase_status ||
                                                        'paid'
                                                    }
                                                    onChange={(e) =>
                                                        setSelectedPurchase({
                                                            ...selectedPurchase,
                                                            purchase_status:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="rounded border p-1"
                                                >
                                                    <option value="paid">
                                                        {t(
                                                            'purchase.purchase_status.paid',
                                                        )}
                                                    </option>
                                                    <option value="partial">
                                                        {t(
                                                            'purchase.purchase_status.partial',
                                                        )}
                                                    </option>
                                                    <option value="due">
                                                        {t(
                                                            'purchase.purchase_status.due',
                                                        )}
                                                    </option>
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-[10px] font-bold text-white uppercase opacity-80">
                                                {t(
                                                    `purchase.payment_method_text.${selectedPurchase.purchase_method}`,
                                                )}{' '}
                                                &bull;{' '}
                                                {t(
                                                    `purchase.purchase_status.${selectedPurchase.purchase_status}`,
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ================= BODY ================= */}
                            <div className="p-6">
                                {/* ================= SUMMARY ================= */}
                                <div className="mb-6 flex justify-end">
                                    <div className="w-full space-y-2 text-sm md:w-80">
                                        <div className="flex justify-between">
                                            <span>
                                                {t(
                                                    'purchase_history.transport_fee',
                                                )}
                                            </span>
                                            <span>
                                                {currency}
                                                {Number(
                                                    selectedPurchase.transport_fee ||
                                                        0,
                                                ).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>
                                                {t('purchase_history.tax')}
                                            </span>
                                            <span>
                                                {currency}
                                                {Number(
                                                    selectedPurchase.tax_amount ||
                                                        0,
                                                ).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>
                                                {t('purchase_history.discount')}
                                            </span>
                                            <span>
                                                -{currency}
                                                {Number(
                                                    selectedPurchase.discount_amount ||
                                                        0,
                                                ).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                            <span>
                                                {t(
                                                    'purchase_history.grand_total',
                                                )}
                                            </span>
                                            <span>
                                                {currency}
                                                {finalTotal().toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ITEMS TABLE */}
                                <div className="overflow-hidden rounded-lg border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                                <th className="p-3 text-left">
                                                    {t('purchase_history.item')}
                                                </th>
                                                <th className="p-3 text-center">
                                                    {t('purchase_history.qty')}
                                                </th>
                                                <th className="p-3 text-center">
                                                    {t('purchase_history.unit')}
                                                </th>
                                                <th className="p-3 text-right">
                                                    {t(
                                                        'purchase_history.price',
                                                    )}
                                                </th>
                                                <th className="p-3 text-right">
                                                    {t(
                                                        'purchase_history.amount',
                                                    )}
                                                </th>
                                                {mode === 'edit' && (
                                                    <th className="p-3 text-center"></th>
                                                )}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {selectedPurchase?.details?.map(
                                                (item: any) => (
                                                    <tr
                                                        key={item.id}
                                                        className="border-t hover:bg-gray-50"
                                                    >
                                                        <td className="p-3 font-medium">
                                                            {
                                                                item
                                                                    .purchase_item
                                                                    ?.name
                                                            }
                                                        </td>

                                                        <td className="p-3 text-center">
                                                            {mode === 'edit' ? (
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        item.qty
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const updated =
                                                                            {
                                                                                ...selectedPurchase,
                                                                            };

                                                                        updated.details =
                                                                            updated.details.map(
                                                                                (
                                                                                    d: any,
                                                                                ) =>
                                                                                    d.id ===
                                                                                    item.id
                                                                                        ? {
                                                                                              ...d,
                                                                                              qty: Number(
                                                                                                  e
                                                                                                      .target
                                                                                                      .value,
                                                                                              ),
                                                                                          }
                                                                                        : d,
                                                                            );

                                                                        setSelectedPurchase(
                                                                            updated,
                                                                        );
                                                                    }}
                                                                    className="w-16 rounded border p-1 text-center"
                                                                />
                                                            ) : (
                                                                item.qty
                                                            )}
                                                        </td>

                                                        <td className="p-3 text-center">
                                                            {item.unit}
                                                        </td>

                                                        <td className="p-3 text-right">
                                                            {mode === 'edit' ? (
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        item.price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const updated =
                                                                            {
                                                                                ...selectedPurchase,
                                                                            };

                                                                        updated.details =
                                                                            updated.details.map(
                                                                                (
                                                                                    d: any,
                                                                                ) =>
                                                                                    d.id ===
                                                                                    item.id
                                                                                        ? {
                                                                                              ...d,
                                                                                              price: Number(
                                                                                                  e
                                                                                                      .target
                                                                                                      .value,
                                                                                              ),
                                                                                          }
                                                                                        : d,
                                                                            );

                                                                        setSelectedPurchase(
                                                                            updated,
                                                                        );
                                                                    }}
                                                                    className="w-20 rounded border p-1 text-right"
                                                                />
                                                            ) : (
                                                                currency +
                                                                item.price
                                                            )}
                                                        </td>

                                                        <td className="p-3 text-right font-semibold">
                                                            {currency}
                                                            {(
                                                                Number(
                                                                    item.qty,
                                                                ) *
                                                                Number(
                                                                    item.price,
                                                                )
                                                            ).toLocaleString()}
                                                        </td>

                                                        {mode === 'edit' && (
                                                            <td className="p-3 text-center">
                                                                <button
                                                                    onClick={() => {
                                                                        const updated =
                                                                            {
                                                                                ...selectedPurchase,
                                                                            };
                                                                        updated.details =
                                                                            updated.details.filter(
                                                                                (
                                                                                    d: any,
                                                                                ) =>
                                                                                    d.id !==
                                                                                    item.id,
                                                                            );
                                                                        setSelectedPurchase(
                                                                            updated,
                                                                        );
                                                                    }}
                                                                    className="rounded p-1 text-red-600 transition hover:bg-red-100"
                                                                    title="Remove Item"
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ),
                                            )}
                                            {mode === 'edit' && (
                                                <tr className="border-t bg-gray-50">
                                                    <td
                                                        className="p-3"
                                                        colSpan={6}
                                                    >
                                                        <select
                                                            className="w-full rounded border p-2 text-sm"
                                                            onChange={(e) => {
                                                                if (
                                                                    !e.target
                                                                        .value
                                                                )
                                                                    return;
                                                                const pItem =
                                                                    purchase_items?.find(
                                                                        (
                                                                            p: any,
                                                                        ) =>
                                                                            p.id ===
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                    );
                                                                if (pItem) {
                                                                    const newDetail =
                                                                        {
                                                                            id:
                                                                                'new-' +
                                                                                Date.now(),
                                                                            purchase_item_id:
                                                                                pItem.id,
                                                                            qty: 1,
                                                                            price: pItem.price,
                                                                            unit: pItem.unit,
                                                                            purchase_item:
                                                                                pItem,
                                                                        };
                                                                    setSelectedPurchase(
                                                                        {
                                                                            ...selectedPurchase,
                                                                            details:
                                                                                [
                                                                                    ...(selectedPurchase.details ||
                                                                                        []),
                                                                                    newDetail,
                                                                                ],
                                                                        },
                                                                    );
                                                                }
                                                                e.target.value =
                                                                    ''; // Reset
                                                            }}
                                                        >
                                                            <option value="">
                                                                +{' '}
                                                                {t(
                                                                    'purchase_history.add_item',
                                                                ) || 'Add Item'}
                                                            </option>
                                                            {purchase_items?.map(
                                                                (p: any) => (
                                                                    <option
                                                                        key={
                                                                            p.id
                                                                        }
                                                                        value={
                                                                            p.id
                                                                        }
                                                                    >
                                                                        {p.name}{' '}
                                                                        -{' '}
                                                                        {
                                                                            currency
                                                                        }
                                                                        {
                                                                            p.price
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ================= FOOTER ================= */}
                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200"
                                    >
                                        {t('purchase_history.print')}
                                    </button>

                                    {mode === 'edit' && (
                                        <button
                                            disabled={saving}
                                            onClick={async () => {
                                                if (!selectedPurchase) return;

                                                setSaving(true);

                                                const payload = {
                                                    transport_fee:
                                                        selectedPurchase.transport_fee,
                                                    tax_amount:
                                                        selectedPurchase.tax_amount,
                                                    discount_amount:
                                                        selectedPurchase.discount_amount,
                                                    total_amount: finalTotal(),
                                                    purchase_date:
                                                        selectedPurchase.purchase_date,
                                                    purchase_method:
                                                        selectedPurchase.purchase_method ||
                                                        'cash',
                                                    purchase_status:
                                                        selectedPurchase.purchase_status ||
                                                        'paid',
                                                    details:
                                                        selectedPurchase.details.map(
                                                            (d: any) => ({
                                                                id: String(
                                                                    d.id,
                                                                ).startsWith(
                                                                    'new-',
                                                                )
                                                                    ? null
                                                                    : d.id,
                                                                purchase_item_id:
                                                                    d.purchase_item_id,
                                                                qty: d.qty,
                                                                price: d.price,
                                                                unit: d.unit,
                                                                purchase_item:
                                                                    d.purchase_item,
                                                            }),
                                                        ),
                                                };

                                                await axios.put(
                                                    route(
                                                        'purchase-history.update',
                                                        selectedPurchase.id,
                                                    ),
                                                    payload,
                                                );

                                                setSaving(false);
                                                setShowViewDialog(false);
                                                fetchData();
                                            }}
                                            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                        >
                                            {saving
                                                ? 'Saving...'
                                                : t(
                                                      'purchase_history.save_changes',
                                                  )}
                                        </button>
                                    )}

                                    <DialogClose asChild>
                                        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                                            {t('purchase_history.close')}
                                        </button>
                                    </DialogClose>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {alertAction === 'trash' &&
                                t('purchase_history.trash')}
                            {alertAction === 'restore' &&
                                t('purchase_history.restore')}
                            {alertAction === 'force_delete' &&
                                t('purchase_history.force_delete')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertAction === 'trash' &&
                                t('purchase_history.trash_title')}
                            {alertAction === 'restore' &&
                                'Are you sure you want to restore this purchase to the active list?'}
                            {alertAction === 'force_delete' &&
                                'This action cannot be undone. This will permanently delete the purchase and all associated details from the database.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('purchase_history.close')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAlertConfirm}
                            className={
                                alertAction === 'force_delete' ||
                                alertAction === 'trash'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                            }
                        >
                            {t('purchase_history.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
