import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from 'react';
import { t } from 'i18next';
const PRESETS = [
    { value: 'all', label: t('income.date_preset.all') },
    { value: 'today', label: t('income.date_preset.today') },
    { value: 'yesterday', label: t('income.date_preset.yesterday') },
    { value: 'this_month', label: t('income.date_preset.this_month') },
    { value: 'last_week', label: t('income.date_preset.last_week') },
    { value: 'last_month', label: t('income.date_preset.last_month') },
    { value: 'custom', label: t('income.date_preset.custom') },
];

export default function IncomeStatement({ data, settings, filters }: any) {
    const currency = settings?.currency_symbol || '$';
    const formatMoney = (val: any) => Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const [preset, setPreset] = useState(filters?.preset || 'all');
    const [fromDate, setFromDate] = useState(filters?.from_date || '');
    const [toDate, setToDate] = useState(filters?.to_date || '');

    const applyFilters = () => {
        router.get('/income-statement', {
            preset: preset || undefined,
            from_date: preset === 'custom' && fromDate ? fromDate : undefined,
            to_date: preset === 'custom' && toDate ? toDate : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const exportData = (format: 'excel' | 'pdf') => {
        const queryParams = new URLSearchParams();
        queryParams.append('format', format);

        if (preset && preset !== 'all' && preset !== 'custom') {
            queryParams.append('preset', preset);
        } else if (preset === 'custom') {
            queryParams.append('preset', 'custom');
            if (fromDate) queryParams.append('from_date', fromDate);
            if (toDate) queryParams.append('to_date', toDate);
        }

        window.location.href = `/income-statement/export?${queryParams.toString()}`;
    };

    return (
        <>
            <Head title="Income Statement" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-4xl mx-auto w-full">
                <div className="p-2">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('income.income_statement')}</h1>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => exportData('excel')}>
                                📄 {t('income.export')} Excel
                            </Button>
                            <Button variant="outline" onClick={() => exportData('pdf')}>
                                📕 {t('income.export')} PDF
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
                        <div className="flex flex-col gap-1 w-full md:w-48">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('income.date_preset_label')}</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={preset}
                                onChange={e => setPreset(e.target.value)}
                            >
                                {PRESETS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {preset === 'custom' && (
                            <>
                                <div className="flex flex-col gap-1 w-full md:w-40">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('income.date_preset.from_date')}</label>
                                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1 w-full md:w-40">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('income.date_preset.to_date')}</label>
                                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                                </div>
                            </>
                        )}

                        <Button onClick={applyFilters} className="w-full md:w-auto h-10 px-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                            {t('income.filter')}
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm">
                        <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">{t('income.financial_summary')}</h2>
                            <p className="text-xs text-gray-500 mt-1">{t('income.based_on_selected_date_range')}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Revenue Section */}
                            <div>
                                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-xs mb-3 border-b pb-2">{t('income.revenue')}</h3>
                                <div className="flex justify-between items-center py-2 px-4 hover:bg-slate-50 rounded-lg">
                                    <span className="text-gray-600">{t('income.total_sales')}</span>
                                    <span className="font-semibold">{currency}{formatMoney(data.totalSales)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 px-4 hover:bg-slate-50 rounded-lg">
                                    <span className="text-gray-600 pl-4 border-l-2 border-indigo-200 ml-1">{t('income.collect_cash')}</span>
                                    <span className="font-semibold text-green-700">{currency}{formatMoney(data.collectedSales)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 px-4 hover:bg-slate-50 rounded-lg">
                                    <span className="text-gray-600 pl-4 border-l-2 border-indigo-200 ml-1">{t('income.collect_due')}</span>
                                    <span className="font-semibold text-orange-600">{currency}{formatMoney(data.accountsReceivable)}</span>
                                </div>
                            </div>

                            {/* COGS Section */}
                            <div>
                                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-xs mb-3 border-b pb-2">{t('income.cost_of_goods_sold_title')}</h3>
                                <div className="flex justify-between items-center py-2 px-4 hover:bg-slate-50 rounded-lg">
                                    <span className="text-gray-600">{t('income.cost_of_goods_sold')}</span>
                                    <span className="font-semibold text-red-600">({currency}{formatMoney(data.cogs)})</span>
                                </div>
                            </div>

                            {/* Gross Profit */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex justify-between items-center">
                                <span className="font-bold text-indigo-900">{t('income.gross_profit')}</span>
                                <span className="font-bold text-lg text-indigo-700">{currency}{formatMoney(data.grossProfit)}</span>
                            </div>

                            {/* Operating Expenses Section */}
                            <div>
                                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-xs mb-3 border-b pb-2">{t('income.operating_expenses')}</h3>
                                <div className="space-y-1">
                                    {data.expensesBreakdown.map((expense: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-2 px-4 hover:bg-slate-50 rounded-lg pl-8">
                                            <span className="text-gray-600">{expense.expense_name}</span>
                                            <span className="text-gray-600">{currency}{formatMoney(expense.total_amount)}</span>
                                        </div>
                                    ))}
                                    {data.expensesBreakdown.length === 0 && (
                                        <div className="py-2 px-4 text-gray-400 italic text-sm">No expenses recorded for this period.</div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center py-3 px-4 mt-2 border-t border-dashed">
                                    <span className="font-semibold text-gray-800">{t('income.total_operating_expenses')}</span>
                                    <span className="font-semibold text-red-600">({currency}{formatMoney(data.totalExpenses)})</span>
                                </div>
                            </div>

                            {/* Net Income */}
                            <div className={`rounded-lg p-5 flex justify-between items-center shadow-inner ${data.netIncome >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <div>
                                    <span className={`font-black text-xl uppercase tracking-widest ${data.netIncome >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                        {data.netIncome >= 0 ? t('income.net_profit') : t('income.net_loss')}
                                    </span>
                                </div>
                                <span className={`font-black text-2xl ${data.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {currency}{formatMoney(data.netIncome)}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
