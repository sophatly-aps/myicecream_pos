// resources/js/Pages/customers/rent-history.tsx

import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { useState } from 'react';
import {
    ArrowLeftIcon,
    DownloadIcon,
    PrinterIcon,
    CalendarIcon,
    DollarSignIcon,
    FileSpreadsheetIcon
} from 'lucide-react';
import { route } from 'ziggy-js';
import axios from 'axios';

interface RentPayment {
    id: number;
    payment_date: string;
    amount: number | string;
    next_due_date: string;
    notes: string | null;
    created_at: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    address: string;
    rent_amount: number | string;
    rent_due_date: string | null;
    last_paid_date: string | null;
    rentPayments: RentPayment[];
}

interface Props {
    customer: Customer;
    rentPayments: RentPayment[];
    settings: {
        currency_symbol?: string;
        [key: string]: any;
    };
}

export default function RentHistory({ customer, rentPayments, settings }: Props) {
    const [isExporting, setIsExporting] = useState(false);
    const currencySymbol = settings?.currency_symbol || '$';

    // Format currency
    const formatCurrency = (amount: number | string) => {
        if (!amount) return '-';
        const numAmount = Number(amount);
        if (isNaN(numAmount)) return '-';
        return `${currencySymbol}${numAmount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    };

    // Format date
    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB');
    };

    // Handle export
    const handleExport = async () => {
        setIsExporting(true);
        try {
            // For CSV export
            window.location.href = route('customers.rent-history.export', customer.id);
            toast.success('Export started successfully!');
        } catch (error) {
            toast.error('Failed to export data.');
        } finally {
            setIsExporting(false);
        }
    };

    // Handle print
    const handlePrint = () => {
        const printContent = document.getElementById('printable-content');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Rent History - ${customer.name}</title>
                        <style>
                            body { font-family: sans-serif; padding: 40px; color: #111827; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .header h1 { font-size: 24px; margin: 0; }
                            .header p { color: #6b7280; margin: 5px 0; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background-color: #f3f4f6; font-weight: 600; }
                            .text-center { text-align: center; }
                            .summary { margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 5px; }
                            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                            .summary-item { text-align: center; }
                            .summary-item label { display: block; color: #6b7280; font-size: 12px; }
                            .summary-item value { display: block; font-size: 18px; font-weight: bold; margin-top: 5px; }
                            @media print {
                                body { padding: 0; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                        <script>
                            window.onload = () => {
                                setTimeout(() => {
                                    window.print();
                                    window.close();
                                }, 250);
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow?.document.close();
        }
    };

    // Calculate summary
    const totalPaid = rentPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const lastPayment = rentPayments.length > 0 ? rentPayments[0] : null;

    return (
        <>
            <Head title={`Rent History - ${customer.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit(route('customers.index'))}
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                                ត្រឡប់ក្រោយ
                            </Button>
                            <div className='ml-5'>
                                <h1 className="text-2xl font-bold mb-2">ប្រវត្តិបង់ថ្លៃផ្ទះ</h1>
                                <p className="text-lg font-medium text-gray-800">{customer.name}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 no-print">
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                disabled={isExporting || rentPayments.length === 0}
                            >
                                <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
                                {isExporting ? 'Exporting...' : 'Export Excel'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                disabled={rentPayments.length === 0}
                            >
                                <PrinterIcon className="h-4 w-4 mr-2" />
                                បោះពុម្ព
                            </Button>
                        </div>
                    </div>

                    {/* Customer Info Cards */}
                    <div id="printable-content">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">សរុបថ្លៃបង់ទាំងអស់</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">ថ្លៃបង់ចុងក្រោយ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-semibold">
                                        {lastPayment ? formatCurrency(lastPayment.amount) : '-'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {lastPayment ? formatDate(lastPayment.payment_date) : 'No payments'}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">ថ្លៃផ្ទះប្រចាំខែ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatCurrency(customer.rent_amount)}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">ថ្ងៃខែឆ្នាំត្រូវបង់បន្ទាប់</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-semibold">{formatDate(customer.rent_due_date)}</div>
                                    <div className="text-sm text-gray-500">
                                        {formatDate(customer.last_paid_date)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Rent Payments Table */}
                        {rentPayments.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-3 text-left font-semibold">#</th>
                                            <th className="p-3 text-left font-semibold">ថ្ងៃខែឆ្នាំបានបង់</th>
                                            <th className="p-3 text-left font-semibold">ចំនួនទឹកប្រាក់</th>
                                            <th className="p-3 text-left font-semibold">ថ្ងៃខែឆ្នាំត្រូវបង់បន្ទាប់</th>
                                            <th className="p-3 text-left font-semibold">កំណត់សម្គាល់</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rentPayments.map((payment, index) => (
                                            <tr key={payment.id} className="border-t hover:bg-gray-50">
                                                <td className="p-3">{index + 1}</td>
                                                <td className="p-3">{formatDate(payment.payment_date)}</td>
                                                <td className="p-3 font-medium">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="p-3">
                                                    {formatDate(payment.next_due_date)}
                                                </td>
                                                <td className="p-3 text-gray-600">
                                                    {payment.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-8 text-center text-gray-500">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No rent payment history found for this customer.</p>
                                    <p className="text-sm mt-2">Payments will appear here once recorded.</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Summary Section */}
                        {rentPayments.length > 0 && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold mb-2">កំណត់ត្រាបង់ថ្លៃផ្ទះ</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">ចំនួនបង់</p>
                                        <p className="text-lg font-semibold">{rentPayments.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">សរុបទឹកប្រាក់</p>
                                        <p className="text-lg font-semibold">{formatCurrency(totalPaid)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">មធ្យមភាគ</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(totalPaid / rentPayments.length)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">ថ្ងៃខែឆ្នាំបានបង់ចុងក្រោយ</p>
                                        <p className="text-lg font-semibold">
                                            {formatDate(lastPayment?.payment_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}