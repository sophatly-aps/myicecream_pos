import { Head, router, Link } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { route } from 'ziggy-js';

import { buildColumns, PaySlip } from "./columns";
import { DataTable } from "./data-table";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useTranslation } from 'react-i18next';
import { PlusIcon, Printer } from 'lucide-react';
import { usePage } from '@inertiajs/react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
    payslips: any;
    employees: any[];
    currency: string;
    company_name: string;
    settings: any;
    filters?: Record<string, any>;
}


export default function Index({ payslips, employees, currency, company_name, settings, filters }: Props) {

    const { t } = useTranslation();

    // Create modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Delete & View state
    const [deletingPaySlip, setDeletingPaySlip] = useState<PaySlip | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [viewingPaySlip, setViewingPaySlip] = useState<PaySlip | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const openViewModal = (pay_slip: PaySlip) => {
        setViewingPaySlip(pay_slip);
    };

    const openEditModal = (pay_slip: PaySlip) => {
        router.get(route('payslips.edit', pay_slip.id));
    };

    const handleCreateProceed = () => {
        if (!selectedEmployeeId || !selectedMonth) return;
        router.get(route('payslips.create', { employee_id: selectedEmployeeId, month: selectedMonth }));
    };

    // ── Filtering & Export ───────────────────────────────────────────────────

    const [filterMonth, setFilterMonth] = useState(filters?.filter_month || '');

    const applyFilters = () => {
        router.get('/payslips', {
            filter_month: filterMonth || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const exportData = () => {
        const queryParams = new URLSearchParams();
        queryParams.append('format', 'excel');

        if (filterMonth) {
            queryParams.append('filter_month', filterMonth);
        }

        window.location.href = `/payslips/export?${queryParams.toString()}`;
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = (pay_slip: PaySlip) => {
        setDeletingPaySlip(pay_slip);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingPaySlip) return;
        router.delete(route('payslips.destroy', deletingPaySlip.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingPaySlip(null);
                toast.success(t('payslip.delete_success'));
            },
            onError: (errors: any) => {
                toast.error(t('payslip.delete_error'));
            }
        });
    };

    // ── Table columns (with callbacks wired) ─────────────────────────────────

    const columns = buildColumns(currency, openViewModal, openEditModal, handleDelete);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title={t('payslip.title')} />


            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('payslip.title')}</h1>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={exportData}>
                                📄 {t('payslip.export_excel') || 'Export Excel'}
                            </Button>
                            <Button className="bg-indigo-800 hover:bg-indigo-700" onClick={() => setIsCreateOpen(true)}>
                                <PlusIcon className="size-4" />
                                {t('payslip.create_payslip')}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-gray-200 mb-4">
                        <div className="flex flex-col gap-1 w-full md:w-48">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('payslip.month')}</label>
                            <Input
                                type="month"
                                value={filterMonth}
                                onChange={e => setFilterMonth(e.target.value)}
                            />
                        </div>

                        <Button onClick={applyFilters} className="w-full md:w-auto h-10 px-8">
                            {t('payslip.filter') || 'Filter'}
                        </Button>
                    </div>

                    <DataTable columns={columns} data={payslips.data} />

                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-500">
                            {t('payslip.show_record')} {payslips.from} {t('payslip.to')} {payslips.to} {t('payslip.page')} {payslips.total}
                        </div>

                        <div className="flex gap-1">
                            {payslips.links.map((link: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (link.url) {
                                            router.get(link.url, {}, {
                                                preserveState: true,
                                                preserveScroll: true
                                            });
                                        }
                                    }}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 text-sm rounded border ${link.active
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white hover:bg-gray-50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('payslip.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('payslip.delete_label')} {' '}
                            <span className="font-semibold text-foreground">"{deletingPaySlip?.employee?.name}"</span>{' '}
                            {t('payslip.delete_cannot_undo')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingPaySlip(null)}>{t('payslip.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('payslip.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Create Modal ────────────────────────────────────────────── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('payslip.create_payslip') || 'Create Payslip'}</DialogTitle>
                        <DialogDescription>
                            {t('payslip.select_employee_and_month')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('payslip.employee_name') || 'Employee'}</Label>
                            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('payslip.select_an_employee')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees?.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            {emp.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('payslip.month')}</Label>
                            <Input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{t('payslip.cancel') || 'Cancel'}</Button>
                        </DialogClose>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleCreateProceed}
                            disabled={!selectedEmployeeId || !selectedMonth}
                        >
                            {t('payslip.proceed')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── View / Print Modal ──────────────────────────────────────── */}
            <Dialog open={!!viewingPaySlip} onOpenChange={() => setViewingPaySlip(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl border-none shadow-2xl">
                    <div id="payslip-print" className="p-10 bg-white text-slate-900">
                        {/* Header */}
                        <div className="mb-8 flex justify-between items-end border-b-4 border-slate-900 pb-5">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    {company_name}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">
                                    {t('payslip.official_employee_payslip')}
                                </p>
                            </div>
                            <div className="text-right text-[10px] font-mono text-slate-400">
                                {t('payslip.salary_slip_id')}: #{viewingPaySlip?.id}
                                <br />
                                {t('payslip.month')}: {new Date().toLocaleDateString()}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="border-2 border-slate-900 overflow-hidden mb-6">
                            <table className="w-full text-sm border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-900 bg-slate-50">
                                        <td className="p-4 font-bold border-r border-slate-900 uppercase text-[10px] text-slate-500 w-1/3">
                                            {t('payslip.employee_name')}
                                        </td>
                                        <td className="p-4 font-black text-xl text-slate-900 italic">
                                            {viewingPaySlip?.employee?.name}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-300">
                                        <td className="p-4 font-bold border-r border-slate-300 uppercase text-[10px] text-slate-500">
                                            {t('payslip.month')}
                                        </td>
                                        <td className="p-4 font-mono font-bold tracking-widest text-base">
                                            {viewingPaySlip?.month}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-900">
                                        <td className="p-4 font-bold border-r border-slate-900 uppercase text-[10px] text-slate-500">
                                            {t('payslip.status_label')}
                                        </td>
                                        <td className="p-4 uppercase font-bold text-sm">
                                            {t(`payslip.payslip_status.${viewingPaySlip?.status}`)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Salary Breakdown */}
                        <h3 className="font-bold uppercase text-[12px] tracking-wider mb-2">{t('payslip.salary_breakdown')}</h3>
                        <div className="border-2 border-slate-900 overflow-hidden">
                            <table className="w-full text-sm border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-300">
                                        <td className="p-3 border-r border-slate-300">{t('payslip.base_salary')}</td>
                                        <td className="p-3 text-right font-mono">{currency}{Number(viewingPaySlip?.base_salary || 0).toLocaleString('en-US')}</td>
                                    </tr>
                                    <tr className="border-b border-slate-300 bg-red-50 text-red-700">
                                        <td className="p-3 border-r border-slate-300">{t('payslip.advance_deduction')}</td>
                                        <td className="p-3 text-right font-mono">- {currency}{Number(viewingPaySlip?.total_advance || 0).toLocaleString('en-US')}</td>
                                    </tr>
                                    <tr className="border-b border-slate-300 bg-red-50 text-red-700">
                                        <td className="p-3 border-r border-slate-300">Absent Deduction ({viewingPaySlip?.absent_days || 0} days)</td>
                                        <td className="p-3 text-right font-mono">- {currency}{Number(viewingPaySlip?.absent_deduction || 0).toLocaleString('en-US')}</td>
                                    </tr>
                                    <tr className="border-b border-slate-900 bg-red-50 text-red-700">
                                        <td className="p-3 border-r border-slate-900">{t('payslip.other_deduction')}</td>
                                        <td className="p-3 text-right font-mono">- {currency}{Number(viewingPaySlip?.other_deductions || 0).toLocaleString('en-US')}</td>
                                    </tr>
                                    <tr className="bg-slate-900 text-white font-black text-lg">
                                        <td className="p-4 border-r border-slate-700 uppercase">{t('payslip.net_salary')}</td>
                                        <td className="p-4 text-right">{currency}{Number(viewingPaySlip?.net_salary || 0).toLocaleString('en-US')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            <span>{t('payslip.employee_signature')}</span>
                            <span>{t('payslip.employee_signature')}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100 print:hidden">
                        <Button
                            onClick={() => window.print()}
                            className="flex-1 bg-slate-900 text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
                        >
                            <Printer size={18} /> {t('payslip.print_payslip')}
                        </Button>
                        <Button
                            onClick={() => setViewingPaySlip(null)}
                            variant="outline"
                            className="px-8 py-6 rounded-xl font-bold"
                        >
                            {t('payslip.cancel')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'sidebar.payslip', href: '/payslips' },
    ],
};
