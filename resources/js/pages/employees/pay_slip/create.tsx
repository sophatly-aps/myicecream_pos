import * as React from 'react';
import { router, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';

interface Props {
    employee: {
        id: number;
        name: string;
    };
    month: string;
    base_salary: number;
    total_advance: number;
    absent_days: number;
    absent_deduction: number;
    net_salary: number;
    currency: string;
}

export default function Create({ employee, month, base_salary, total_advance, absent_days, absent_deduction, currency }: Props) {
    const { t } = useTranslation();
    const baseSalary = Number(base_salary);
    const advanceDeduction = Number(total_advance);
    const absentDays = Number(absent_days);
    const absentDeduction = Number(absent_deduction);
    const [otherDeduction, setOtherDeduction] = React.useState(0);

    const netSalary = baseSalary - advanceDeduction - absentDeduction - otherDeduction;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">
                {t('payslip.create_payslip_form_title')} {employee.name} - {month}
            </h2>

            <div className="bg-white p-6 rounded shadow mb-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">{t('payslip.employee_name')}</p>
                        <p className="font-semibold">{employee.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('payslip.month')}</p>
                        <p className="font-semibold">{month}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            {t('payslip.base_salary')}
                        </label>
                        <p className="text-lg font-bold">{currency}{baseSalary.toLocaleString('en-US')}</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            {t('payslip.advance_deduction')}
                        </label>
                        <p className="text-lg font-bold text-red-500">
                            {currency}{advanceDeduction.toLocaleString('en-US')}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            Absent Deduction ({absentDays} days)
                        </label>
                        <p className="text-lg font-bold text-red-500">
                            {currency}{absentDeduction.toLocaleString('en-US')}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">
                            {t('payslip.other_deduction')}
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded p-2 text-lg font-bold text-red-500 focus:ring-2 focus:ring-blue-500"
                            value={otherDeduction}
                            onChange={(e) => setOtherDeduction(Number(e.target.value) || 0)}
                            min="0"
                        />
                    </div>
                </div>

                <div className="mt-8 border-t pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">{t('payslip.net_salary')}</span>
                        <span className="text-3xl font-bold text-green-600">
                            {currency}{netSalary.toLocaleString('en-US')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-4">
                <button
                    onClick={() =>
                        router.post(route('payslips.store'), {
                            employee_id: employee.id,
                            month,
                            base_salary: baseSalary,
                            advance_deduction: advanceDeduction,
                            absent_days: absentDays,
                            absent_deduction: absentDeduction,
                            other_deduction: otherDeduction,
                            net_salary: netSalary,
                        })
                    }
                    className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                    {t('payslip.save_payslip')}
                </button>
                <Link
                    href={route('employees.index')}
                    className="px-6 py-3 border rounded hover:bg-gray-50 font-semibold"
                >
                    {t('payslip.cancel')}
                </Link>
            </div>
        </div>
    );
}