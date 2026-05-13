import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { route } from 'ziggy-js';

import { useTranslation } from 'react-i18next';

import { buildColumns, Expense } from "./columns";
import { DataTable } from "./data-table";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
    expenses: Expense[];
    settings: Record<string, any>;
    filters?: Record<string, any>;
}

const PRESETS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' },
];

const EMPTY_FORM = {
    expense_name: '',
    expense_amount: '',
    expense_date: '',
    description: '',
    status: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Index({ expenses, settings, filters }: Props) {

    const { t } = useTranslation();

    // Filter state
    const [preset, setPreset] = useState(filters?.preset || 'all');
    const [fromDate, setFromDate] = useState(filters?.from_date || '');
    const [toDate, setToDate] = useState(filters?.to_date || '');

    const applyFilters = () => {
        router.get('/expense', {
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

        window.location.href = `/expense/export?${queryParams.toString()}`;
    };

    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Delete state
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Form state (managed manually — not useForm — because image is a File)
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openCreateModal = () => {
        setEditingExpense(null);
        resetForm();
        setForm(f => ({ ...f, status: 'active' }));
        setIsOpen(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setForm({
            expense_name: expense.expense_name ?? '',
            expense_amount: expense.expense_amount ? Number(expense.expense_amount).toLocaleString("en-US") : '',
            expense_date: (expense as any).expense_date ?? '',
            description: expense.description != null ? String(expense.description) : '',
            status: expense.status,
        });
        setIsOpen(true);
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();
        fd.append('expense_name', form.expense_name);
        fd.append('expense_date', form.expense_date);
        fd.append('expense_amount', form.expense_amount.toString().replace(/,/g, ''));
        fd.append('description', form.description);
        fd.append('status', form.status);

        if (editingExpense) {
            fd.append('_method', 'PUT');
            router.post(route('expense.update', editingExpense.id), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success('Expense updated successfully!');
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Please fix the errors and try again.');
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route('expense.store'), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success('Expense created successfully!');
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Please fix the errors and try again.');
                },
                onFinish: () => setProcessing(false),
            });
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = (expense: Expense) => {
        setDeletingExpense(expense);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingExpense) return;
        router.delete(route('expense.destroy', deletingExpense.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingExpense(null);
                toast.success(`"${deletingExpense.expense_name}" deleted successfully!`);
            },
            onError: () => toast.error('Failed to delete expense. Please try again.'),
        });
    };

    // ── Table columns (with callbacks wired) ─────────────────────────────────

    const columns = buildColumns(settings, openEditModal, handleDelete);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Products" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('expense.all_expenses')}</h1>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => exportData('excel')}>
                                📄 {t('expense.export')} Excel
                            </Button>
                            <Button variant="outline" onClick={() => exportData('pdf')}>
                                📕 {t('expense.export')} PDF
                            </Button>
                            <Button className="bg-indigo-800 hover:bg-indigo-700" onClick={openCreateModal}>
                                {t('expense.add')}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-gray-200 mb-4">
                        <div className="flex flex-col gap-1 w-full md:w-48">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('expense.date_preset_label')}</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={preset}
                                onChange={e => setPreset(e.target.value)}
                            >
                                {PRESETS.map(p => (
                                    <option key={p.value} value={p.value}>{t(`expense.date_preset.${p.value}`)}</option>
                                ))}
                            </select>
                        </div>

                        {preset === 'custom' && (
                            <>
                                <div className="flex flex-col gap-1 w-full md:w-40">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('expense.date_preset.from_date')}</label>
                                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1 w-full md:w-40">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('expense.date_preset.to_date')}</label>
                                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                                </div>
                            </>
                        )}

                        <Button onClick={applyFilters} className="w-full md:w-auto h-10 px-8">
                            {t('expense.filter')}
                        </Button>
                    </div>

                    <div className="py-4">
                        <DataTable columns={columns} data={expenses} />
                    </div>
                </div>
            </div>

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { setEditingExpense(null); resetForm(); }
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <form onSubmit={submit} encType="multipart/form-data">
                        <DialogHeader className="mb-4">
                            <DialogTitle>{editingExpense ? t('expense.edit_expense') : t('expense.add_expense')}</DialogTitle>
                            <DialogDescription>
                                {/* {editingExpense ? 'Edit the expense information below.' : 'Fill in the details of the new expense.'} */}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">

                            {/* Expense Name */}
                            <div className="space-y-1">
                                <Label htmlFor="expense_name">{t('expense.expense_name')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="expense_name"
                                    name="expense_name"
                                    type="text"
                                    value={form.expense_name}
                                    onChange={e => setForm(f => ({ ...f, expense_name: e.target.value }))}
                                    placeholder="ប្រាក់ខែបុគ្គលិក"
                                />
                                {errors.expense_name && <p className="text-red-500 text-xs">{errors.expense_name}</p>}
                            </div>


                            {/* Expense Date */}
                            <div className="space-y-1">
                                <Label htmlFor="expense_date">{t('expense.expense_date')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="expense_date"
                                    name="expense_date"
                                    type="date"
                                    value={form.expense_date}
                                    onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                                />
                                {errors.expense_date && <p className="text-red-500 text-xs">{errors.expense_date}</p>}
                            </div>

                            {/* Expense Amount */}
                            <div className="space-y-1">
                                <Label htmlFor="expense_amount">{t('expense.expense_amount')} <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                        {settings.currency_symbol}
                                    </span>
                                    <Input
                                        id="expense_amount"
                                        name="expense_amount"
                                        type="text"
                                        inputMode="decimal"
                                        className="pl-7"
                                        value={form.expense_amount}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9.,]/g, '');
                                            setForm(f => ({ ...f, expense_amount: val }));
                                        }}
                                        onBlur={e => {
                                            const rawValue = e.target.value.replace(/,/g, '');
                                            if (!isNaN(Number(rawValue)) && rawValue !== '') {
                                                setForm(f => ({ ...f, expense_amount: Number(rawValue).toLocaleString("en-US") }));
                                            }
                                        }}
                                        onFocus={e => {
                                            setForm(f => ({ ...f, expense_amount: e.target.value.replace(/,/g, '') }));
                                        }}
                                    />
                                </div>
                                {errors.expense_amount && <p className="text-red-500 text-xs">{errors.expense_amount}</p>}
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <Label htmlFor="description">{t('expense.description')}</Label>
                                    <Input
                                        id="description"
                                        name="description"
                                        type="text"
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    />

                                </div>
                            </div>

                            {/* Product Status */}
                            <div className="space-y-1">
                                <Label>{t('expense.status_label')} <span className="text-red-500">*</span></Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('expense.status.active')}</SelectItem>
                                        <SelectItem value="inactive">{t('expense.status.inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
                            </div>


                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                {t('expense.close')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {processing ? t('expense.save_processing') : (editingExpense ? t('expense.update_expense') : t('expense.add_expense'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('expense.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('expense.delete_label')} {' '}
                            <span className="font-semibold text-foreground">"{deletingExpense?.expense_name}"</span>{' '}
                            {t('expense.delete_cannot_undo')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingExpense(null)}>{t('expense.close')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('expense.delete_expense')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: ('expense.title'), href: '/expense' },
    ],
};
