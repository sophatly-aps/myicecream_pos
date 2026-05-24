import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
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
import { EyeIcon, PencilIcon, Trash2 } from 'lucide-react';

import { route } from 'ziggy-js';

export default function History({
    orders,
    filters,
    settings,
    grandTotal,
    company_name,
    customers,
}: any) {
    const { t } = useTranslation();
    const currency = settings?.currency_symbol;
    const formatMoney = (val: any) =>
        Number(val || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const [invoiceNo, setInvoiceNo] = useState(filters?.invoice_no || '');
    const [preset, setPreset] = useState(filters?.preset || 'all');
    const [fromDate, setFromDate] = useState(filters?.from_date || '');
    const [toDate, setToDate] = useState(filters?.to_date || '');

    const PRESETS = [
        { value: 'all', label: t('sales.date_preset.all_time') },
        { value: 'today', label: t('sales.date_preset.today') },
        { value: 'yesterday', label: t('sales.date_preset.yesterday') },
        { value: 'last_week', label: t('sales.date_preset.last_week') },
        { value: 'last_month', label: t('sales.date_preset.last_month') },
        { value: 'custom', label: t('sales.date_preset.custom') },
        { value: 'trash', label: t('sales.date_preset.trash') },
    ];

    const [viewOrder, setViewOrder] = useState<any>(null);
    const [editOrder, setEditOrder] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({
        order_date: '',
        payment_method: '',
        payment_status: '',
        paid_amount: 0,
        customer_id: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const [alertAction, setAlertAction] = useState<
        'restore' | 'force_delete' | 'trash' | null
    >(null);
    const [alertOrderId, setAlertOrderId] = useState<number | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const openAlert = (
        action: 'restore' | 'force_delete' | 'trash',
        id: number,
    ) => {
        setAlertAction(action);
        setAlertOrderId(id);
        setIsAlertOpen(true);
    };

    const handleAlertConfirm = () => {
        if (!alertOrderId || !alertAction) return;

        setIsAlertOpen(false);

        if (alertAction === 'trash') {
            axios
                .delete(route('sales.destroy', alertOrderId))
                .then((res) => {
                    toast.success(res.data.message || 'Action successful');
                    router.reload({ only: ['orders', 'grandTotal'] });
                })
                .catch((err) => {
                    const errorMsg =
                        err.response?.data?.message ||
                        err.message ||
                        'Action failed';
                    toast.error(errorMsg);
                });
        } else if (alertAction === 'restore') {
            axios
                .post(route('sales.restore', alertOrderId))
                .then((res) => {
                    toast.success(res.data.message || 'Action successful');
                    router.reload({ only: ['orders', 'grandTotal'] });
                })
                .catch((err) => {
                    const errorMsg =
                        err.response?.data?.message ||
                        err.message ||
                        'Action failed';
                    toast.error(errorMsg);
                });
        } else if (alertAction === 'force_delete') {
            axios
                .delete(route('sales.forceDelete', alertOrderId))
                .then((res) => {
                    toast.success(res.data.message || 'Action successful');
                    router.reload({ only: ['orders', 'grandTotal'] });
                })
                .catch((err) => {
                    const errorMsg =
                        err.response?.data?.message ||
                        err.message ||
                        'Action failed';
                    toast.error(errorMsg);
                });
        }
    };

    const openEditModal = (order: any) => {
        setEditOrder(order);
        setEditFormData({
            order_date: order.order_date,
            payment_method: order.payment_method,
            payment_status: 'paid',
            paid_amount: Number(order.total_amount) || 0,
            customer_id: order.customer_id || '',
        });
    };

    const handleSaveEdit = () => {
        setIsSaving(true);
        axios
            .put(`/sales/${editOrder.id}`, editFormData)
            .then((res) => {
                if (res.data.success) {
                    toast.success('Order updated successfully!');
                    setEditOrder(null);
                    router.reload({ only: ['orders'] });
                }
            })
            .catch((err) => {
                toast.error('Failed to update order');
            })
            .finally(() => setIsSaving(false));
    };

    const applyFilters = () => {
        router.get(
            '/sales-history',
            {
                invoice_no: invoiceNo || undefined,
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

    const exportExcel = () => {
        const queryParams = new URLSearchParams();
        if (invoiceNo) queryParams.append('invoice_no', invoiceNo);
        if (preset) queryParams.append('preset', preset);
        if (preset === 'custom' && fromDate)
            queryParams.append('from_date', fromDate);
        if (preset === 'custom' && toDate)
            queryParams.append('to_date', toDate);
        queryParams.append('format', 'excel');

        window.location.href = `/sales-history/export?${queryParams.toString()}`;
    };

    const columnHelper = createColumnHelper<any>();
    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'index',
                header: '#',
                cell: (info) => {
                    const from = orders?.from || 1;
                    return <span>{from + info.row.index}</span>;
                },
            }),
            columnHelper.accessor('invoice_no', {
                header: t('sales.invoice_no'),
                cell: (info) => (
                    <span className="font-bold">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor('customer.name', {
                header: t('sales.customer'),
                cell: (info) => info.getValue() || t('pos.all'),
            }),
            columnHelper.accessor('order_date', {
                header: t('sales.date'),
                cell: (info) =>
                    new Date(info.getValue()).toLocaleDateString('en-GB'),
            }),
            columnHelper.accessor('sub_total', {
                header: t('sales.sub_total'),
                cell: (info) => (
                    <span>
                        {currency}
                        {Number(info.getValue() || 0).toFixed(2)}
                    </span>
                ),
            }),
            columnHelper.accessor('tax_amount', {
                header: t('sales.tax'),
                cell: (info) => (
                    <span>
                        {currency}
                        {Number(info.getValue() || 0).toFixed(2)}
                    </span>
                ),
            }),
            columnHelper.accessor('discount_amount', {
                header: t('sales.discount'),
                cell: (info) => {
                    const val = Number(info.getValue() || 0);
                    return (
                        <span
                            className={
                                val > 0 ? 'font-medium text-red-500' : ''
                            }
                        >
                            {currency}
                            {val.toFixed(2)}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('transport_fee', {
                header: t('sales.transport_fee'),
                cell: (info) => (
                    <span>
                        {currency}
                        {Number(info.getValue() || 0).toFixed(2)}
                    </span>
                ),
            }),
            columnHelper.accessor('total_amount', {
                header: t('sales.total_amount'),
                cell: (info) => (
                    <span className="font-bold text-indigo-700">
                        {currency}
                        {Number(info.getValue() || 0).toFixed(2)}
                    </span>
                ),
            }),
            columnHelper.accessor('paid_amount', {
                header: t('sales.paid_amount'),
                cell: (info) => (
                    <span className="font-bold text-green-700">
                        {currency}
                        {Number(info.getValue() || 0).toFixed(2)}
                    </span>
                ),
            }),
            columnHelper.accessor('payment_method', {
                header: t('sales.method'),
                cell: (info) => (
                    <Badge variant="outline" className="uppercase">
                        {info.getValue() === 'cash'
                            ? t('sales.payment_method.cash')
                            : info.getValue() === 'aba'
                              ? t('sales.payment_method.aba')
                              : t('sales.payment_method.wing')}
                    </Badge>
                ),
            }),
            columnHelper.accessor('payment_status', {
                header: t('sales.status'),
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
                            {t(`sales.payment_status.${status}`)}
                        </Badge>
                    );
                },
            }),
            columnHelper.display({
                id: 'actions',
                header: t('sales.actions'),
                cell: (props) => {
                    const order = props.row.original;
                    return (
                        <div className="flex gap-2">
                            {preset === 'trash' ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border-green-500 text-green-600 hover:bg-green-50"
                                        size="sm"
                                        title="Restore"
                                        onClick={() =>
                                            openAlert('restore', order.id)
                                        }
                                    >
                                        ♻️
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-red-500 text-red-600 hover:bg-red-50"
                                        size="sm"
                                        title="Delete Permanently"
                                        onClick={() =>
                                            openAlert('force_delete', order.id)
                                        }
                                    >
                                        ❌
                                    </Button>
                                </>
                            ) : (
                                <>
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
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        title="Trash"
                                        onClick={() =>
                                            openAlert('trash', order.id)
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                </>
                            )}
                        </div>
                    );
                },
            }),
        ],
        [preset, t, currency],
    );

    const table = useReactTable({
        data: orders.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <Head title={t('sales.sale_list')} />

            <div className="flex w-full flex-col gap-4 overflow-hidden p-6">
                <div className="flex flex-col items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
                    <div className="flex w-full flex-col gap-1 md:w-48">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            {t('sales.invoice_no')}
                        </label>
                        <Input
                            placeholder="INV-..."
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && applyFilters()
                            }
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1 md:w-48">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            {t('sales.date_search')}
                        </label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                                    {t('expense.date_preset.from_date')}
                                </label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) =>
                                        setFromDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex w-full flex-col gap-1 md:w-40">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    {t('expense.date_preset.to_date')}
                                </label>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <Button
                        onClick={applyFilters}
                        className="h-10 w-full px-8 md:w-auto"
                    >
                        {t('sales.filter')}
                    </Button>
                    <Button
                        onClick={exportExcel}
                        variant="outline"
                        className="h-10 w-full border-green-600 px-8 text-green-600 hover:bg-green-50 md:w-auto"
                    >
                        Export Excel
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-indigo-800 uppercase">
                            {t('sales.total_sale')}
                        </p>
                        <p className="mt-1 text-[10px] text-indigo-600">
                            {t('sales.total_sale_description')}
                        </p>
                    </div>
                    <div className="text-2xl font-black text-indigo-700">
                        {currency}
                        {Number(grandTotal || 0).toLocaleString('en-US', {
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
                                            <th
                                                key={header.id}
                                                className="px-6 py-4 font-bold"
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
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
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className="px-6 py-4 whitespace-nowrap"
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                            No sales found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {orders.links && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 p-4 md:flex-row">
                            <div className="text-sm text-gray-500">
                                Showing{' '}
                                <span className="font-bold text-gray-900">
                                    {orders.from || 0}
                                </span>{' '}
                                to{' '}
                                <span className="font-bold text-gray-900">
                                    {orders.to || 0}
                                </span>{' '}
                                of{' '}
                                <span className="font-bold text-gray-900">
                                    {orders.total || 0}
                                </span>{' '}
                                entries
                            </div>
                            <div className="flex gap-1 overflow-x-auto">
                                {orders.links.map((link: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                        disabled={!link.url || link.active}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        className={`rounded-md border px-4 py-2 text-sm transition-all ${
                                            link.active
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
            <Dialog
                open={!!viewOrder}
                onOpenChange={(open) => !open && setViewOrder(null)}
            >
                <DialogContent className="max-w-md overflow-hidden rounded-xl border-none bg-[#f1f5f9] p-0 font-sans shadow-2xl">
                    <div className="flex items-center justify-between p-4">
                        <h2 className="bg-transparent text-sm font-bold text-gray-800">
                            {t('sales.invoice')}
                        </h2>
                    </div>

                    {viewOrder && (
                        <div className="bg-[#f1f5f9] px-8 pt-2 pb-8">
                            {/* Header / Logo section */}
                            <div className="mb-6 flex items-start justify-between border-b border-gray-300 pb-4">
                                <div>
                                    <h1 className="text-[22px] font-bold tracking-tight text-blue-700 italic shadow-blue-500/50 drop-shadow-sm">
                                        {company_name}
                                    </h1>
                                </div>
                                <div className="text-right">
                                    <h2 className="font-bold tracking-widest text-gray-800">
                                        {t('sales.invoice')}
                                    </h2>
                                    <p className="mt-1 text-[11px] font-bold text-blue-600">
                                        #{viewOrder.invoice_no}
                                    </p>
                                </div>
                            </div>

                            {/* Customer / Date */}
                            <div className="mb-6 flex items-end justify-between text-sm">
                                <div>
                                    <p className="mb-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                                        {t('sales.customer')}
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800">
                                        {viewOrder.customer?.name ||
                                            'Walk-in Customer'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="mb-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                                        {t('sales.date')}
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800">
                                        {new Date(
                                            viewOrder.order_date,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Items Header */}
                            <div className="mb-4 grid grid-cols-12 gap-2 border-b border-gray-200 pb-2 text-[9px] font-bold text-gray-400 uppercase">
                                <div className="col-span-6">
                                    {t('sales.item_description')}
                                </div>
                                <div className="col-span-2 text-center">
                                    {t('sales.qty')}
                                </div>
                                <div className="col-span-2 text-right">
                                    {t('sales.price')}
                                </div>
                                <div className="col-span-2 text-right">
                                    {t('sales.total')}
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="mb-6 min-h-[100px] space-y-4">
                                {viewOrder.details?.map((detail: any) => (
                                    <div
                                        key={detail.id}
                                        className="grid grid-cols-12 gap-2 text-[13px]"
                                    >
                                        <div className="col-span-6 pr-2 font-bold text-gray-800">
                                            {detail.product?.name}
                                        </div>
                                        <div className="col-span-2 text-center text-gray-800">
                                            {detail.quantity}
                                            {detail?.unit}
                                        </div>
                                        <div className="col-span-2 text-right text-gray-800">
                                            {currency}
                                            {formatMoney(detail.price)}
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-gray-800">
                                            {currency}
                                            {formatMoney(detail.subtotal)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end border-t-2 border-gray-200 pt-4">
                                <div className="w-[60%] space-y-2 text-[13px] text-gray-600">
                                    <div className="flex justify-between">
                                        <span>{t('sales.sub_total')}</span>
                                        <span className="font-bold text-gray-800">
                                            {currency}
                                            {formatMoney(
                                                Number(viewOrder.sub_total),
                                            )}
                                        </span>
                                    </div>
                                    {Number(viewOrder.tax_amount) > 0 && (
                                        <div className="flex justify-between">
                                            <span>{t('sales.tax')}</span>
                                            <span className="font-bold text-gray-800">
                                                +{currency}
                                                {Number(
                                                    viewOrder.tax_amount,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {Number(viewOrder.discount_amount) > 0 && (
                                        <div className="flex justify-between">
                                            <span>{t('sales.discount')}</span>
                                            <span className="font-bold text-red-500">
                                                -{currency}
                                                {Number(
                                                    viewOrder.discount_amount,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {Number(viewOrder.transport_fee) > 0 && (
                                        <div className="flex justify-between">
                                            <span>
                                                {t('sales.transport_fee')}
                                            </span>
                                            <span className="font-bold text-red-800">
                                                -{currency}
                                                {Number(
                                                    viewOrder.transport_fee,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="mt-2 flex justify-between border-t-2 border-gray-800 pt-2">
                                        <span className="text-lg font-bold text-gray-800">
                                            {t('sales.total')}
                                        </span>
                                        <span className="text-xl font-bold text-blue-700">
                                            {currency}
                                            {Number(
                                                viewOrder.total_amount,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="mt-6 text-right">
                                <span className="text-[10px] font-bold tracking-widest text-blue-700 uppercase">
                                    {viewOrder.payment_status === 'paid'
                                        ? t('sales.payment_status.paid')
                                        : `${viewOrder.payment_status == 'paid' ? 'បង់រួច' : viewOrder.payment_status == 'partial' ? 'បង់ខ្លះ' : viewOrder.payment_status == 'due' ? 'ជំពាក់' : ''}`}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 rounded-b-xl border-t border-gray-100 bg-white p-4">
                        <Button
                            className="flex flex-1 items-center justify-center rounded-xl bg-gray-900 py-6 text-sm font-bold tracking-wide text-white shadow-lg hover:bg-gray-800"
                            onClick={() => {
                                if (viewOrder) {
                                    let printFrame = document.getElementById(
                                        'print-receipt-frame',
                                    ) as HTMLIFrameElement;
                                    if (!printFrame) {
                                        printFrame =
                                            document.createElement('iframe');
                                        printFrame.id = 'print-receipt-frame';
                                        printFrame.style.position = 'absolute';
                                        printFrame.style.width = '0px';
                                        printFrame.style.height = '0px';
                                        printFrame.style.border = 'none';
                                        document.body.appendChild(printFrame);
                                    }
                                    printFrame.src = `/sales/printHtml/${viewOrder.id}`;
                                }
                            }}
                        >
                            🖨️ {t('sales.print_invoice')}
                        </Button>
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                className="px-6 font-bold text-gray-500 hover:bg-gray-100"
                            >
                                {t('sales.close')}
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog
                open={!!editOrder}
                onOpenChange={(open) => !open && setEditOrder(null)}
            >
                <DialogContent className="max-w-sm rounded-xl">
                    <h2 className="mb-4 font-sans text-lg font-bold">
                        {t('sales.edit_title')}
                    </h2>
                    {editOrder && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                <span className="text-[10px] font-bold tracking-widest text-indigo-800 uppercase">
                                    {t('sales.grand_total')}
                                </span>
                                <span className="text-lg font-bold text-indigo-700">
                                    {currency}
                                    {formatMoney(editOrder.total_amount)}
                                </span>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.date')}
                                </label>
                                <Input
                                    type="date"
                                    className="font-sans"
                                    value={editFormData.order_date}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            order_date: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.method')}
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm outline-none"
                                    value={editFormData.customer_id}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            customer_id: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Walk-in Customer</option>
                                    {customers?.map((customer: any) => (
                                        <option
                                            key={customer.id}
                                            value={customer.id}
                                        >
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.payment_method_label')}
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm outline-none"
                                    value={editFormData.payment_method}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            payment_method: e.target.value,
                                        })
                                    }
                                >
                                    <option value="cash">
                                        {t('sales.payment_method.cash')}
                                    </option>
                                    <option value="aba">
                                        {t('sales.payment_method.aba')}
                                    </option>
                                    <option value="wing">
                                        {t('sales.payment_method.wing')}
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.payment_status_label')}
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm outline-none"
                                    value={editFormData.payment_status}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            payment_status: e.target.value,
                                        })
                                    }
                                >
                                    <option value="paid">
                                        {t('sales.payment_status.paid')}
                                    </option>
                                    <option value="partial">
                                        {t('sales.payment_status.partial')}
                                    </option>
                                    <option value="due">
                                        {t('sales.payment_status.due')}
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('sales.paid_amount')}
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="font-sans font-bold"
                                    value={editFormData.paid_amount}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            paid_amount: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {isSaving
                                        ? t('sales.save_processing')
                                        : t('sales.save_changes')}
                                </Button>
                                <DialogClose asChild>
                                    <Button variant="outline">
                                        {t('sales.cancel')}
                                    </Button>
                                </DialogClose>
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
                                t('sales.move_to_trash')}
                            {alertAction === 'restore' && 'Restore Order?'}
                            {alertAction === 'force_delete' &&
                                'Permanent Delete?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertAction === 'trash' &&
                                t('sales.move_to_trash_description')}
                            {alertAction === 'restore' &&
                                'Are you sure you want to restore this order to the active list?'}
                            {alertAction === 'force_delete' &&
                                'This action cannot be undone. This will permanently delete the order and all associated details from the database.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('sales.close')}
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
                            {t('sales.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

History.layout = {
    breadcrumbs: [
        {
            title: 'Sales History',
            href: '/sales-history',
        },
    ],
};
