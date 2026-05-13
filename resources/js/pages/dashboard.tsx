import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, BadgePercent, Activity } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import DateFilter from "@/components/DateFilter";
import { useTranslation } from 'react-i18next';

// Color map for pie chart
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#0088FE', '#00C49F'];

export default function Dashboard({
    startDate,
    endDate,
    metrics,
    salesOverview,
    paymentMethods,
    popularMenu,
    settings
}: any) {
    const currency = settings?.currency_symbol || '$';

    const { t } = useTranslation();

    const renderTrend = (trend: number) => {
        if (trend >= 0) {
            return <span className="text-sm font-medium text-green-600 flex items-center mt-1">↗ {trend}% From last month</span>;
        }
        return <span className="text-sm font-medium text-red-600 flex items-center mt-1">↘ {Math.abs(trend)}% From last month</span>;
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden rounded-xl p-6 bg-[#fdfdfd] dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800">
            <Head title="Dashboard" />

            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('dashboard.title')}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t('dashboard.description')}
                        </p>
                    </div>
                </div>

                {/* Date Dropdown Placeholder aligned to the right like in the image */}
                <div className="bg-white dark:bg-neutral-800 border-slate-200">
                    <DateFilter routeName="dashboard" />
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-2">
                <Card className="shadow-sm border-slate-100 relative overflow-hidden dark:bg-neutral-800 flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('dashboard.Total Revenue')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{currency}{Number(metrics.totalRevenue.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        {renderTrend(metrics.totalRevenue.trend)}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-100 relative overflow-hidden dark:bg-neutral-800 flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                                <FileText className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('dashboard.Total Order')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.totalOrder.value}</div>
                        {renderTrend(metrics.totalOrder.trend)}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-100 relative overflow-hidden dark:bg-neutral-800 flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 text-green-600 rounded-md">
                                <Activity className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('dashboard.Average Sale')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{currency}{Number(metrics.averageSale.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        {renderTrend(metrics.averageSale.trend)}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-100 relative overflow-hidden dark:bg-neutral-800 flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-md">
                                <BadgePercent className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('dashboard.Total Discount')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{currency}{Number(metrics.totalDiscount.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        {renderTrend(metrics.totalDiscount.trend)}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-1">

                {/* Line Chart */}
                <Card className="col-span-1 shadow-sm border-slate-100 pt-6">
                    <div className="px-6 flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.Sales Overview')}</h2>
                    </div>
                    <div className="h-[300px] w-full px-2 pb-4">
                        {salesOverview.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesOverview} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => {
                                            const date = new Date(str);
                                            return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                                        }}
                                        stroke="#cbd5e1"
                                        tick={{ fill: '#64748b' }}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#cbd5e1"
                                        tick={{ fill: '#64748b' }}
                                        tickFormatter={(val) => val >= 1000 ? `${(val / 1000)}k` : val}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => [`${currency}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Revenue"]}
                                        labelFormatter={(label) => new Date(label).toDateString()}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">No data available for this range.</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Popular Menu Table Section */}
            <Card className="shadow-sm border-slate-100">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.Popular Menu')}</h2>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#fcf8f6] text-slate-600 dark:bg-neutral-800 border-b border-orange-100 dark:border-neutral-700">
                                <tr>
                                    <th className="px-4 py-4 font-medium rounded-tl-lg">{t('dashboard.No')}</th>
                                    <th className="px-4 py-4 font-medium">{t('dashboard.Menu')}</th>
                                    <th className="px-4 py-4 font-medium">{t('dashboard.Price')}</th>
                                    <th className="px-4 py-4 font-medium">{t('dashboard.Sold Quantity')}</th>
                                    <th className="px-4 py-4 font-medium">{t('dashboard.Discount')}</th>
                                    <th className="px-4 py-4 font-medium rounded-tr-lg">{t('dashboard.Total Income')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {popularMenu.length > 0 ? popularMenu.map((item: any, index: number) => (
                                    <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                                        <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                                        <td className="px-4 py-4 flex items-center gap-3">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md flex-shrink-0 border border-slate-200" />
                                            ) : (
                                                <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 flex-shrink-0">IMG</div>
                                            )}
                                            <span className="font-semibold text-slate-900 dark:text-slate-200 whitespace-nowrap">{item.name}</span>
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">{currency}{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4 text-slate-600">{item.sold_quantity}</td>
                                        <td className="px-4 py-4 text-slate-600">{item.discount}</td>
                                        <td className="px-4 py-4 text-slate-900 dark:text-white font-semibold">{currency}{Number(item.total_income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                            No sales data to rank yet in this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'dashboard.title',
            href: dashboard(),
        },
    ],
};
