import * as React from 'react';
import { router, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';

interface Props {
    payslip: {
        id: number;
        employee_id: number;
        month: string;
        base_salary: number;
        total_advance: number;
        absent_days: number;
        absent_deduction: number;
        other_deductions: number;
        net_salary: number;
        status: string;
        employee?: {
            name: string;
        };
    };
}

export default function Edit({ payslip }: Props) {
    const { t } = useTranslation();

    const [baseSalary, setBaseSalary] = React.useState(Number(payslip.base_salary || 0));
    const [advanceDeduction, setAdvanceDeduction] = React.useState(Number(payslip.total_advance || 0));
    const [absentDays, setAbsentDays] = React.useState(Number(payslip.absent_days || 0));
    const [absentDeduction, setAbsentDeduction] = React.useState(Number(payslip.absent_deduction || 0));
    const [otherDeduction, setOtherDeduction] = React.useState(Number(payslip.other_deductions || 0));
    const [status, setStatus] = React.useState(payslip.status || 'paid');

    const netSalary = baseSalary - advanceDeduction - absentDeduction - otherDeduction;

    const handleSubmit = () => {
        router.put(route('payslips.update', payslip.id), {
            base_salary: baseSalary,
            advance_deduction: advanceDeduction,
            absent_days: absentDays,
            absent_deduction: absentDeduction,
            other_deduction: otherDeduction,
            net_salary: netSalary,
            status: status,
        });
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">
                {t('payslip.edit')} - {payslip.employee?.name} ({payslip.month})
            </h2>

            <div className="bg-white p-6 rounded shadow mb-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">{t('payslip.employee_name')}</p>
                        <p className="font-semibold">{payslip.employee?.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Month</p>
                        <p className="font-semibold">{payslip.month}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            {t('payslip.gross_salary')}
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded p-2 text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                            value={baseSalary}
                            onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            Advance Salary Deduction
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded p-2 text-lg font-bold text-red-500 focus:ring-2 focus:ring-blue-500"
                            value={advanceDeduction}
                            onChange={(e) => setAdvanceDeduction(Number(e.target.value) || 0)}
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            Absent Days
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded p-2 text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                            value={absentDays}
                            onChange={(e) => {
                                const days = Number(e.target.value) || 0;
                                setAbsentDays(days);
                                setAbsentDeduction((baseSalary / 30) * days);
                            }}
                            min="0"
                            max="31"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            Absent Deduction
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded p-2 text-lg font-bold text-red-500 focus:ring-2 focus:ring-blue-500"
                            value={absentDeduction}
                            onChange={(e) => setAbsentDeduction(Number(e.target.value) || 0)}
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            Other Deductions
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded p-2 text-lg font-bold text-red-500 focus:ring-2 focus:ring-blue-500"
                            value={otherDeduction}
                            onChange={(e) => setOtherDeduction(Number(e.target.value) || 0)}
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            {t('payslip.status_label')}
                        </label>
                        <select
                            className="w-full border rounded p-2 text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8 border-t pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">{t('payslip.net_salary')}</span>
                        <span className="text-3xl font-bold text-green-600">
                            ${netSalary.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-4">
                <button
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                    {t('payslip.save_processing').replace('...', '')}
                </button>
                <Link
                    href={route('payslips.index')}
                    className="px-6 py-3 border rounded hover:bg-gray-50 font-semibold"
                >
                    {t('payslip.cancel')}
                </Link>
            </div>
        </div>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Payslips', href: '/payslips' },
        { title: 'Edit', href: '#' },
    ],
};
