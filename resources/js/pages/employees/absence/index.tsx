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
import DateFilter from '@/components/DateFilter';
import { useTranslation } from 'react-i18next';

export default function AbsenceIndex() {
    const { t } = useTranslation();
    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden rounded-xl border border-slate-100 bg-[#fdfdfd] p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <Head title="Absence" />
        </div>
    );
}

AbsenceIndex.layout = {
    breadcrumbs: [
        {
            title: 'absence.absence_title',
            href: '/absence',
        },
    ],
};
