import { useEffect, useState } from "react";
import axios from "axios";
import { route } from "ziggy-js";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    ColumnDef,
} from "@tanstack/react-table";
import { Trash, Eye, Pencil, RotateCcw } from "lucide-react";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useTranslation } from "react-i18next";

type Purchase = {
    id: number;
    purchase_no: string;
    purchase_date: string;
    total_amount: number;
    payment_status: string;
};

export default function PurchaseHistory({ currency }: any) {

    const { t } = useTranslation();

    const [data, setData] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(false);

    const [mode, setMode] = useState<"view" | "edit">("view");

    const [saving, setSaving] = useState(false);

    const [filter, setFilter] = useState("all");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);

    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);

    const [alertAction, setAlertAction] = useState<"restore" | "force_delete" | "trash" | null>(null);
    const [alertPurchaseId, setAlertPurchaseId] = useState<number | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const openAlert = (action: "restore" | "force_delete" | "trash", id: number) => {
        setAlertAction(action);
        setAlertPurchaseId(id);
        setIsAlertOpen(true);
    };

    const handleAlertConfirm = async () => {
        if (!alertPurchaseId || !alertAction) return;

        setIsAlertOpen(false); // close modal immediately for better UX

        try {
            if (alertAction === "trash") {
                await axios.delete(route("purchase-history.destroy", alertPurchaseId));
            } else if (alertAction === "restore") {
                await axios.post(route("purchase-history.restore", alertPurchaseId));
            } else if (alertAction === "force_delete") {
                await axios.delete(route("purchase-history.force", alertPurchaseId));
            }
            fetchData();
        } catch (error) {
            console.error("Action failed:", error);
        }
    };

    // ========================
    // FETCH DATA
    // ========================
    const fetchData = async () => {
        setLoading(true);

        try {
            const res = await axios.get(route("purchase-data"), {
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
            const res = await axios.get(route("purchase-history.show", id), {
                headers: { Accept: "application/json" }
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
            return sum + (Number(item.qty) * Number(item.price));
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
            id: "index",
            header: t('purchase_history.no'),
            cell: ({ row }) => {
                return <span>{row.index + 1}</span>
            }
        },
        {
            accessorKey: "purchase_no",
            header: t("purchase_history.invoice_no"),
        },
        {
            accessorKey: "purchase_date",
            header: t("purchase_history.purchase_date"),
            cell: ({ getValue }) => {
                const date = new Date(getValue() as string);

                return date.toLocaleDateString("en-GB");
            }
        },
        {
            accessorKey: "total_amount",
            header: t("purchase_history.total_amount"),
            cell: ({ getValue }) =>
                `${currency} ${Number(getValue()).toLocaleString()}`,
        },

        // ACTIONS COLUMN
        {
            id: "actions",
            header: t('purchase_history.action'),
            cell: ({ row }) => {
                const purchase = row.original;

                return (
                    <div className="flex items-center gap-2">
                        {filter === "trash" ? (
                            <>
                                {/* RESTORE */}
                                <button
                                    onClick={() => openAlert("restore", purchase.id)}
                                    className="p-2 rounded-full bg-green-600 text-white hover:bg-green-100 hover:text-green-600 transition shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    title="Restore"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>

                                {/* FORCE DELETE */}
                                <button
                                    onClick={() => openAlert("force_delete", purchase.id)}
                                    className="p-2 rounded-full bg-red-800 text-white hover:bg-red-100 hover:text-red-800 transition shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    title="Delete Permanently"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                {/* VIEW */}
                                <button
                                    onClick={async () => {
                                        setMode("view");
                                        setShowViewDialog(true); // open immediately
                                        await fetchPurchaseDetail(purchase.id);
                                    }}
                                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-indigo-100 hover:text-indigo-600 transition shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    title="View"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>

                                {/* EDIT */}
                                <button
                                    onClick={async () => {
                                        setMode("edit");
                                        await fetchPurchaseDetail(purchase.id);
                                        setShowViewDialog(true);
                                    }}
                                    className="p-2 rounded-full bg-yellow-600 text-white hover:bg-blue-100 hover:text-blue-600 transition shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    title="Edit"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>

                                {/* DELETE */}
                                <button
                                    onClick={() => openAlert("trash", purchase.id)}
                                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-100 hover:text-red-600 transition shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    title="Move to Trash"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                )
            }
        }

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
        setFilter("custom");
    };

    return (
        <div className="flex h-screen bg-gray-50">

            {/* ================= SIDEBAR ================= */}
            <div className="w-72 bg-white border-r p-4 space-y-3">

                <h2 className="font-bold text-lg">{t('purchase_history.title')}</h2>

                <button
                    className={`w-full p-2 rounded ${filter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100"
                        }`}
                    onClick={() => setFilter("all")}
                >
                    {t('purchase_history.all')}
                </button>

                <button
                    className={`w-full p-2 rounded ${filter === "today" ? "bg-indigo-600 text-white" : "bg-gray-100"
                        }`}
                    onClick={() => setFilter("today")}
                >
                    {t('purchase_history.today')}
                </button>

                <button
                    className={`w-full p-2 rounded ${filter === "last_week" ? "bg-indigo-600 text-white" : "bg-gray-100"
                        }`}
                    onClick={() => setFilter("last_week")}
                >
                    {t('purchase_history.last_week')}
                </button>

                <button
                    className={`w-full p-2 rounded ${filter === "last_month" ? "bg-indigo-600 text-white" : "bg-gray-100"
                        }`}
                    onClick={() => setFilter("last_month")}
                >
                    {t('purchase_history.last_month')}
                </button>

                <button
                    className={`w-full p-2 rounded ${filter === "this_month" ? "bg-indigo-600 text-white" : "bg-gray-100"
                        }`}
                    onClick={() => setFilter("this_month")}
                >
                    {t('purchase_history.this_month')}
                </button>

                {/* ================= CUSTOM DATE ================= */}
                <div className="pt-4 border-t space-y-2">
                    <p className="text-xs font-bold text-gray-500">
                        {t('purchase_history.custom')}
                    </p>

                    <input
                        type="date"
                        className="w-full border p-2 rounded"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />

                    <input
                        type="date"
                        className="w-full border p-2 rounded"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />

                    <button
                        onClick={applyCustom}
                        className="w-full bg-black text-white p-2 rounded"
                    >
                        {t('purchase_history.apply')}
                    </button>
                </div>

                <button
                    className={`w-full p-2 rounded ${filter === "trash" ? "bg-red-600 text-white" : "bg-gray-100"}`}
                    onClick={() => setFilter("trash")}
                >
                    {t('purchase_history.trash')}
                </button>
            </div>

            {/* ================= TABLE ================= */}
            <div className="flex-1 p-4 overflow-auto">

                {loading ? (
                    <div className="text-center py-10">{t('purchase_history.loading')}</div>
                ) : (
                    <table className="w-full border bg-white rounded-lg overflow-hidden">

                        {/* HEADER */}
                        <thead className="bg-gray-100">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="text-left p-3 border-b"
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        {/* BODY */}
                        <tbody>
                            {table.getRowModel().rows.length === 0 ? (
                                <tr className={filter === "trash" ? "bg-red-50 text-gray-500" : ""}>
                                    <td className="p-4 text-center text-gray-500" colSpan={5}>
                                        {t('purchase_history.no_data_found')}
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-gray-50"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="p-3 border-b"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>



                )}

                <div className="flex justify-between items-center mt-4">

                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        {t('purchase_history.previous')}
                    </button>

                    <span>
                        {t('purchase_history.page')} {meta?.current_page || 1} {t('purchase_history.of')} {meta?.last_page || 1}
                    </span>

                    <button
                        disabled={page === meta?.last_page}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        {t('purchase_history.next')}
                    </button>

                </div>

            </div>

            {/* ✅ DIALOG MUST BE HERE (NOT INSIDE TABLE) */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-xl">

                    {selectedPurchase && (
                        <div className="bg-white">

                            {/* ================= HEADER ================= */}
                            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                                <div className="flex justify-between items-start">

                                    <div>
                                        <h2 className="text-2xl font-bold">
                                            {mode === "edit" ? t('purchase.edit_purchase') : t('purchase.purchase_invoice')}
                                        </h2>
                                        <p className="text-sm opacity-90">
                                            #{selectedPurchase.purchase_no}
                                        </p>
                                    </div>

                                    <div className="text-right text-sm">
                                        <p>{t('purchase_history.purchase_date')}</p>
                                        <p className="font-semibold">
                                            {new Date(selectedPurchase.purchase_date).toLocaleDateString('km-KH', {
                                                day: '2-digit',
                                                year: 'numeric',
                                                month: 'short',
                                            })}
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* ================= BODY ================= */}
                            <div className="p-6">

                                {/* ITEMS TABLE */}
                                <div className="border rounded-lg overflow-hidden">

                                    <table className="w-full text-sm">

                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                                <th className="text-left p-3">{t('purchase_history.item')}</th>
                                                <th className="text-center p-3">{t('purchase_history.qty')}</th>
                                                <th className="text-center p-3">{t('purchase_history.unit')}</th>
                                                <th className="text-right p-3">{t('purchase_history.price')}</th>
                                                <th className="text-right p-3">{t('purchase_history.amount')}</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {selectedPurchase?.details?.map((item: any) => (
                                                <tr key={item.id} className="border-t hover:bg-gray-50">

                                                    <td className="p-3 font-medium">
                                                        {item.purchase_item?.name}
                                                    </td>

                                                    <td className="text-center p-3">
                                                        {mode === "edit" ? (
                                                            <input
                                                                type="number"
                                                                value={item.qty}
                                                                onChange={(e) => {
                                                                    const updated = { ...selectedPurchase };

                                                                    updated.details = updated.details.map((d: any) =>
                                                                        d.id === item.id
                                                                            ? { ...d, qty: Number(e.target.value) }
                                                                            : d
                                                                    );

                                                                    setSelectedPurchase(updated);
                                                                }}
                                                                className="w-16 border rounded p-1 text-center"
                                                            />
                                                        ) : (
                                                            item.qty
                                                        )}
                                                    </td>

                                                    <td className="text-center p-3">
                                                        {item.unit}
                                                    </td>

                                                    <td className="text-right p-3">
                                                        {mode === "edit" ? (
                                                            <input
                                                                type="number"
                                                                value={item.price}
                                                                onChange={(e) => {
                                                                    const updated = { ...selectedPurchase };

                                                                    updated.details = updated.details.map((d: any) =>
                                                                        d.id === item.id
                                                                            ? { ...d, price: Number(e.target.value) }
                                                                            : d
                                                                    );

                                                                    setSelectedPurchase(updated);
                                                                }}
                                                                className="w-20 border rounded p-1 text-right"
                                                            />
                                                        ) : (
                                                            currency + item.price
                                                        )}
                                                    </td>

                                                    <td className="text-right p-3 font-semibold">
                                                        {currency}
                                                        {(Number(item.qty) * Number(item.price)).toLocaleString()}
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>

                                    </table>
                                </div>

                                {/* ================= SUMMARY ================= */}
                                <div className="flex justify-end mt-6">

                                    <div className="w-full md:w-80 space-y-2 text-sm">

                                        <div className="flex justify-between">
                                            <span>{t('purchase_history.transport_fee')}</span>
                                            <span>{currency}{Number(selectedPurchase.transport_fee || 0).toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>{t('purchase_history.tax')}</span>
                                            <span>{currency}{Number(selectedPurchase.tax_amount || 0).toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span>{t('purchase_history.discount')}</span>
                                            <span>-{currency}{Number(selectedPurchase.discount_amount || 0).toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                                            <span>{t('purchase_history.grand_total')}</span>
                                            <span>{currency}{finalTotal().toLocaleString()}</span>
                                        </div>

                                    </div>

                                </div>

                                {/* ================= FOOTER ================= */}
                                <div className="flex justify-end mt-6 gap-2">

                                    <button
                                        onClick={() => window.print()}
                                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                                    >
                                        {t('purchase_history.print')}
                                    </button>

                                    {mode === "edit" && (
                                        <button
                                            disabled={saving}
                                            onClick={async () => {
                                                if (!selectedPurchase) return;

                                                setSaving(true);

                                                const payload = {
                                                    transport_fee: selectedPurchase.transport_fee,
                                                    tax_amount: selectedPurchase.tax_amount,
                                                    discount_amount: selectedPurchase.discount_amount,
                                                    total_amount: finalTotal(),
                                                    details: selectedPurchase.details.map((d: any) => ({
                                                        id: d.id,
                                                        qty: d.qty,
                                                        price: d.price,
                                                    })),
                                                };

                                                await axios.put(
                                                    route("purchase-history.update", selectedPurchase.id),
                                                    payload
                                                );

                                                setSaving(false);
                                                setShowViewDialog(false);
                                                fetchData();
                                            }}
                                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                        >
                                            {saving ? "Saving..." : t('purchase_history.save_changes')}
                                        </button>
                                    )}

                                    <DialogClose asChild>
                                        <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
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
                            {alertAction === "trash" && t('purchase_history.trash')}
                            {alertAction === "restore" && t('purchase_history.restore')}
                            {alertAction === "force_delete" && t('purchase_history.force_delete')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertAction === "trash" && t('purchase_history.trash_title')}
                            {alertAction === "restore" && "Are you sure you want to restore this purchase to the active list?"}
                            {alertAction === "force_delete" && "This action cannot be undone. This will permanently delete the purchase and all associated details from the database."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('purchase_history.close')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAlertConfirm}
                            className={alertAction === "force_delete" || alertAction === "trash" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                        >
                            {t('purchase_history.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>


    );
}