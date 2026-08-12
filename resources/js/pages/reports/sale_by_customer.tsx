import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

export default function SaleByCustomer({
    orders,
    totals,
    filters,
    settings,
    company_name,
    customers,
}: any) {
    const { t } = useTranslation();
    const currency = settings?.currency_symbol || '$';

    const [preset, setPreset] = useState(filters?.preset || 'all');
    const [fromDate, setFromDate] = useState(filters?.from_date || '');
    const [toDate, setToDate] = useState(filters?.to_date || '');
    const [customerId, setCustomerId] = useState(filters?.customer_id || 'all');

    const PRESETS = [
        { value: 'all', label: t('sales.date_preset.all_time') },
        { value: 'today', label: t('sales.date_preset.today') },
        { value: 'yesterday', label: t('sales.date_preset.yesterday') },
        { value: 'last_week', label: t('sales.date_preset.last_week') },
        { value: 'last_month', label: t('sales.date_preset.last_month') },
        { value: 'custom', label: t('sales.date_preset.custom') },
    ];

    const applyFilters = () => {
        router.get(
            '/sale-by-customer',
            {
                customer_id: customerId || undefined,
                preset: preset || undefined,
                from_date: preset === 'custom' && fromDate ? fromDate : undefined,
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
        if (customerId) queryParams.append('customer_id', customerId);
        if (preset) queryParams.append('preset', preset);
        if (preset === 'custom' && fromDate)
            queryParams.append('from_date', fromDate);
        if (preset === 'custom' && toDate)
            queryParams.append('to_date', toDate);
        queryParams.append('format', 'excel');

        window.location.href = `/sale-by-customer/export?${queryParams.toString()}`;
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
            columnHelper.accessor('customer.name', {
                header: t('sale_by_customer.customer'),
                cell: (info) => {
                    const customer = info.row.original.customer;
                    if (!customer) return 'Walk-in Customer';
                    if (customer.parent) {
                        return (
                            <div className="flex flex-col leading-tight py-1">
                                <span className="font-medium text-gray-800">{customer.parent.name}</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-corner-down-right"><polyline points="15 10 20 15 15 20" /><path d="M4 4v7a4 4 0 0 0 4 4h12" /></svg>
                                    {customer.name}
                                </span>
                            </div>
                        );
                    }
                    return customer.name;
                },
            }),
            columnHelper.accessor('total_orders', {
                header: t('sale_by_customer.total_orders'),
                cell: (info) => (
                    <span className="font-bold">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor('total_amount', {
                header: t('sale_by_customer.total_amount'),
                cell: (info) => (
                    <span className="font-bold text-indigo-700">
                        {currency}
                        {Number(info.getValue()).toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        })}
                    </span>
                ),
            }),
            columnHelper.accessor('paid_amount', {
                header: t('sale_by_customer.paid_amount'),
                cell: (info) => (
                    <span className="font-bold text-green-700">
                        {currency}
                        {Number(info.getValue()).toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        })}
                    </span>
                ),
            }),
            columnHelper.accessor('due_amount', {
                header: t('sale_by_customer.due_amount'),
                cell: (info) => {
                    const val = Number(info.getValue() || 0);
                    return (
                        <span className={`font-bold ${val > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {currency}
                            {Number(info.getValue()).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            })}
                        </span>
                    );
                },
            }),
        ],
        [t, currency, orders],
    );

    const table = useReactTable({
        data: orders.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <Head title={t('sale_by_customer.title')} />

            <div className="flex w-full flex-col gap-4 overflow-hidden p-6">
                <div className="flex flex-col items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
                    <div className="flex w-full flex-col gap-1 md:w-64">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            {t('sale_by_customer.customer')}
                        </label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                        >
                            <option value="all">{t('sale_by_customer.all_customers')}</option>
                            {customers?.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.phone ? `- ${c.phone}` : ''}
                                </option>
                            ))}
                        </select>
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
                                    ថ្ងៃចាប់ផ្តើម
                                </label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div className="flex w-full flex-col gap-1 md:w-40">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    ថ្ងៃបញ្ចប់
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                        <div>
                            <p className="text-xs font-bold tracking-widest text-indigo-800 uppercase">
                                {t('sale_by_customer.total_amount')}
                            </p>
                            <p className="mt-1 text-[10px] text-indigo-600">
                                {t('sale_by_customer.description')}
                            </p>
                        </div>
                        <div className="text-2xl font-black text-indigo-700">
                            {currency}
                            {Number(totals?.total_amount || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4 shadow-sm">
                        <div>
                            <p className="text-xs font-bold tracking-widest text-green-800 uppercase">
                                {t('sale_by_customer.paid_amount')}
                            </p>
                        </div>
                        <div className="text-2xl font-black text-green-700">
                            {currency}
                            {Number(totals?.paid_amount || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
                        <div>
                            <p className="text-xs font-bold tracking-widest text-red-800 uppercase">
                                {t('sale_by_customer.due_amount')}
                            </p>
                        </div>
                        <div className="text-2xl font-black text-red-700">
                            {currency}
                            {Number(totals?.due_amount || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            })}
                        </div>
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
                                            No data found.
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
        </>
    );
}
