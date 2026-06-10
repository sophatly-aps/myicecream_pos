import { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { EyeIcon, PencilIcon } from 'lucide-react';

export default function AccountPayable({
    purchases,
    filters,
    settings,
    totalDue,
}: any) {
    const [tableData, setTableData] = useState(purchases.data);

    const { t } = useTranslation();
    const currency = settings?.currency_symbol || '$';
    const formatMoney = (val: any) =>
        Number(val || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const [preset, setPreset] = useState(filters?.preset || 'all');
    const [fromDate, setFromDate] = useState(filters?.from_date || '');
    const [toDate, setToDate] = useState(filters?.to_date || '');

    const [viewOrder, setViewOrder] = useState<any>(null);
    const [editOrder, setEditOrder] = useState<any>(null);

    const PRESETS = [
        { value: 'all', label: t('ar.date_preset.all_time') || 'All Time' },
        { value: 'today', label: t('ar.date_preset.today') || 'Today' },
        { value: 'yesterday', label: t('ar.date_preset.yesterday') || 'Yesterday' },
        { value: 'last_week', label: t('ar.date_preset.last_week') || 'Last Week' },
        { value: 'last_month', label: t('ar.date_preset.last_month') || 'Last Month' },
        { value: 'this_month', label: t('ar.date_preset.this_month') || 'This Month' },
        { value: 'custom', label: t('ar.date_preset.custom') || 'Custom' },
    ];

    const [editFormData, setEditFormData] = useState({
        purchase_date: '',
        paid_date: '',
        purchase_method: '',
        purchase_status: '',
        paid_amount: 0,
    });
    const [isSaving, setIsSaving] = useState(false);

    const openEditModal = (order: any) => {
        setEditOrder(order);

        setEditFormData({
            purchase_date: order.purchase_date,
            paid_date: order.paid_date,
            purchase_method: order.purchase_method || 'cash',
            purchase_status: order.purchase_status,
            paid_amount: 0,
        });
    };

    const currentDueAmount = Number(editOrder?.due_amount || 0);
    const newPaymentAmount = Number(editFormData.paid_amount || 0);
    const remainingDueAmount = currentDueAmount - newPaymentAmount;

    useEffect(() => {
        if (!editOrder) return;

        let status = 'due';

        if (remainingDueAmount <= 0) {
            status = 'paid';
        } else if (newPaymentAmount > 0 || Number(editOrder.paid_amount || 0) > 0) {
            status = 'partial';
        }

        setEditFormData((prev) => ({
            ...prev,
            purchase_status: status,
        }));
    }, [remainingDueAmount, editOrder]);

    const handleSaveEdit = () => {
        setIsSaving(true);

        const finalNewPaid = Number(editOrder.paid_amount || 0) + newPaymentAmount;
        const finalNewDue = remainingDueAmount < 0 ? 0 : remainingDueAmount;

        axios
            .put(`/account-payable/${editOrder.id}`, {
                paid_date: editFormData.paid_date,
                purchase_method: editFormData.purchase_method,
                purchase_status: editFormData.purchase_status,
                paid_amount: finalNewPaid,
                due_amount: finalNewDue,
            })
            .then((res) => {
                if (res.data.success) {
                    toast.success('Purchase updated successfully!');
                    setEditOrder(null);

                    router.reload({
                        only: ['purchases', 'totalDue'],
                    });
                }
            })
            .catch((err) => {
                console.log(err);
                toast.error('Failed to update purchase');
            })
            .finally(() => setIsSaving(false));
    };

    const applyFilters = () => {
        router.get(
            '/account-payable',
            {
                preset: preset || undefined,
                from_date:
                    preset === 'custom' && fromDate ? fromDate : undefined,
                to_date: preset === 'custom' && toDate ? toDate : undefined,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const columnHelper = createColumnHelper<any>();
    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'index',
                header: t('ar.no') || 'No',
                cell: (info) => {
                    const from = purchases?.from || 1;
                    return <span>{from + info.row.index}</span>;
                },
            }),
            columnHelper.accessor('purchase_no', {
                header: t('sales.invoice_no') || 'Invoice No',
                cell: (info) => (
                    <span className="font-bold">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor('purchase_date', {
                header: t('sales.date') || 'Date',
                cell: (info) =>
                    new Date(info.getValue()).toLocaleDateString('en-GB'),
            }),
            columnHelper.accessor('total_amount', {
                header: t('sales.total') || 'Total',
                cell: (info) => (
                    <span className="font-bold text-indigo-700">
                        {currency}
                        {formatMoney(info.getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor('due_amount', {
                header: t('ar.due_amount') || 'Due Amount',
                cell: (info) => {
                    const due = Number(info.row.original.due_amount || 0);
                    return (
                        <span className="font-bold text-red-600">
                            {currency}
                            {formatMoney(due)}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('purchase_method', {
                header: t('sales.method') || 'Method',
                cell: (info) => {
                    const method = info.getValue();
                    return (
                        <Badge variant="outline" className="uppercase">
                            {t(`ar.payment_method.${method}`) || method}
                        </Badge>
                    );
                },
            }),
            columnHelper.accessor('purchase_status', {
                header: t('sales.status') || 'Status',
                cell: (info) => {
                    const status = info.getValue() as string;
                    let bgColor = 'bg-gray-100 text-gray-800';
                    if (status === 'paid')
                        bgColor = 'bg-green-100 text-green-800 border-none';
                    if (status === 'due')
                        bgColor = 'bg-red-100 text-red-800 border-none';
                    if (status === 'partial')
                        bgColor = 'bg-yellow-100 text-yellow-800 border-none';

                    return (
                        <Badge className={`text-[10px] uppercase ${bgColor}`}>
                            {t(`ar.payment_status.${status}`) || status}
                        </Badge>
                    );
                },
            }),
            columnHelper.display({
                id: 'actions',
                header: t('sales.actions') || 'Actions',
                cell: (props) => {
                    const order = props.row.original;
                    return (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                title="Edit"
                                size="sm"
                                onClick={() => openEditModal(order)}
                            >
                                <PencilIcon className="text-yellow-600" />
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                title="View"
                                onClick={() => setViewOrder(order)}
                            >
                                <EyeIcon />
                            </Button>
                        </div>
                    );
                },
            }),
        ],
        [preset, t, currency, purchases],
    );

    useEffect(() => {
        setTableData(purchases.data);
    }, [purchases.data]);

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <Head title="Account Payable" />
            <div className="flex w-full flex-col gap-4 overflow-hidden p-6">
                <div className="flex flex-col items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
                    <div className="flex w-full flex-col gap-1 md:w-48">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            {t('ar.date_search') || 'Date Filter'}
                        </label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={preset}
                            onChange={(e) => setPreset(e.target.value)}
                        >
                            {PRESETS.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {preset === 'custom' && (
                        <>
                            <div className="flex w-full flex-col gap-1 md:w-40">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    From Date
                                </label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div className="flex w-full flex-col gap-1 md:w-40">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    To Date
                                </label>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <Button onClick={applyFilters} className="h-10 w-full px-8 md:w-auto">
                        {t('ar.filter') || 'Filter'}
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-red-800 uppercase">
                            {t('ar.total_due') || 'TOTAL DUE'}
                        </p>
                    </div>
                    <div className="text-2xl font-black text-red-700">
                        {currency}
                        {Number(totalDue || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 text-xs text-gray-700 uppercase">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th key={header.id} className="px-6 py-4 font-bold">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b bg-white transition-colors hover:bg-gray-50"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className="px-6 py-4 whitespace-nowrap"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            No purchases found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {purchases.links && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 p-4 md:flex-row">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-bold text-gray-900">{purchases.from || 0}</span> to <span className="font-bold text-gray-900">{purchases.to || 0}</span> of <span className="font-bold text-gray-900">{purchases.total || 0}</span> entries
                            </div>
                            <div className="flex gap-1 overflow-x-auto">
                                {purchases.links.map((link: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url || link.active}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md border px-4 py-2 text-sm transition-all ${link.active
                                            ? 'border-indigo-600 bg-indigo-600 font-bold text-white'
                                            : !link.url
                                                ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
                <DialogContent className="max-w-md overflow-hidden rounded-xl border-none bg-[#f1f5f9] p-0 font-sans shadow-2xl">
                    {viewOrder && (
                        <div className="bg-[#f1f5f9] px-8 pt-8 pb-8">
                            <div className="mb-6 flex items-start justify-between border-b border-gray-300 pb-4">
                                <div>
                                    <h1 className="text-[22px] font-bold tracking-tight text-blue-700 italic shadow-blue-500/50 drop-shadow-sm">
                                        {settings?.name || 'Store'}
                                    </h1>
                                </div>
                                <div className="text-right">
                                    <h2 className="font-bold tracking-widest text-gray-800">
                                        {t('sales.invoice') || 'INVOICE'}
                                    </h2>
                                    <p className="mt-1 text-[11px] font-bold text-blue-600">
                                        #{viewOrder.purchase_no}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 flex items-end justify-between text-sm">
                                <div className="text-right">
                                    <p className="mb-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                                        {t('sales.date') || 'Date'}
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800">
                                        {new Date(viewOrder.purchase_date).toLocaleDateString('en-GB')}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4 grid grid-cols-12 gap-2 border-b border-gray-200 pb-2 text-[9px] font-bold text-gray-400 uppercase">
                                <div className="col-span-6">{t('sales.item_description') || 'Item'}</div>
                                <div className="col-span-2 text-center">{t('sales.qty') || 'Qty'}</div>
                                <div className="col-span-2 text-right">{t('sales.price') || 'Price'}</div>
                                <div className="col-span-2 text-right">{t('sales.total') || 'Total'}</div>
                            </div>

                            <div className="mb-6 min-h-[100px] space-y-4">
                                {viewOrder.details?.map((detail: any) => (
                                    <div key={detail.id} className="grid grid-cols-12 gap-2 text-[13px]">
                                        <div className="col-span-6 pr-2 font-bold text-gray-800">
                                            {detail.purchase_item?.name}
                                        </div>
                                        <div className="col-span-2 text-center text-gray-800">
                                            {detail.qty} {detail.unit}
                                        </div>
                                        <div className="col-span-2 text-right text-gray-800">
                                            {currency}
                                            {formatMoney(detail.price)}
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-gray-800">
                                            {currency}
                                            {formatMoney(Number(detail.qty) * Number(detail.price))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end border-t-2 border-gray-200 pt-4">
                                <div className="w-[60%] space-y-2 text-[13px] text-gray-600">
                                    <div className="mt-2 flex justify-between border-t-2 border-gray-800 pt-2">
                                        <span className="text-lg font-bold text-gray-800">
                                            {t('sales.grand_total') || 'Total'}
                                        </span>
                                        <span className="text-xl font-bold text-blue-700">
                                            {currency}
                                            {formatMoney(viewOrder.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-right">
                                <span className="text-[10px] font-bold tracking-widest text-blue-700 uppercase">
                                    {viewOrder.purchase_status}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 rounded-b-xl border-t border-gray-100 bg-white p-4">
                        <DialogClose asChild>
                            <Button variant="ghost" className="w-full px-6 font-bold text-gray-500 hover:bg-gray-100">
                                {t('sales.close') || 'Close'}
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editOrder} onOpenChange={(open) => !open && setEditOrder(null)}>
                <DialogContent className="max-w-sm rounded-xl">
                    <h2 className="mb-4 font-sans text-lg font-bold">
                        {t('ar.edit_title') || 'Edit Payment Status'}
                    </h2>
                    {editOrder && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                <span className="text-[10px] font-bold tracking-widest text-indigo-800 uppercase">
                                    {t('ar.due_amount') || 'Due Amount'}
                                </span>
                                <span className="text-lg font-bold text-indigo-700">
                                    {currency}
                                    {formatMoney(currentDueAmount)}
                                </span>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.paid_date') || 'Paid Date'}
                                </label>
                                <Input
                                    type="date"
                                    className="font-sans"
                                    value={editFormData.paid_date || ''}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            paid_date: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.payment_method_label') || 'Payment Method'}
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm outline-none"
                                    value={editFormData.purchase_method}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            purchase_method: e.target.value,
                                        })
                                    }
                                >
                                    <option value="cash">{t('sales.payment_method.cash') || 'Cash'}</option>
                                    <option value="aba">{t('sales.payment_method.aba') || 'ABA'}</option>
                                    <option value="wing">{t('sales.payment_method.wing') || 'Wing'}</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.payment_status_label') || 'Payment Status'}
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm outline-none"
                                    value={editFormData.purchase_status}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            purchase_status: e.target.value,
                                        })
                                    }
                                >
                                    <option value="paid">{t('sales.payment_status.paid') || 'Paid'}</option>
                                    <option value="partial">{t('sales.payment_status.partial') || 'Partial'}</option>
                                    <option value="due">{t('sales.payment_status.due') || 'Due'}</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.paid_amount') || 'Paid Amount'}
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="font-sans font-bold"
                                    value={editFormData.paid_amount || ''}
                                    onChange={(e) => {
                                        let value = Number(e.target.value);

                                        if (value > currentDueAmount) {
                                            value = currentDueAmount;
                                        }

                                        setEditFormData({
                                            ...editFormData,
                                            paid_amount: value,
                                        });
                                    }}
                                />
                            </div>

                            <div className="flex justify-between rounded-lg border border-green-100 bg-green-50 p-3">
                                <span className="text-[10px] font-bold text-green-700 uppercase">
                                    {t('ar.remaining_due') || 'Remaining Due'}
                                </span>

                                <span className="font-bold text-green-700">
                                    {currency}
                                    {formatMoney(remainingDueAmount < 0 ? 0 : remainingDueAmount)}
                                </span>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {isSaving ? 'Processing...' : t('account_payable.save_changes')}
                                </Button>
                                <DialogClose asChild>
                                    <Button variant="outline">
                                        {t('sales.close') || 'Close'}
                                    </Button>
                                </DialogClose>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

AccountPayable.layout = {
    breadcrumbs: [
        {
            title: 'Account Payable',
            href: '/account-payable',
        },
    ],
};
