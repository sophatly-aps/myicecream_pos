import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { route } from 'ziggy-js';

import { buildColumns, Absence } from './columns';
import { DataTable } from './data-table';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { useTranslation } from 'react-i18next';
import { PlusIcon } from 'lucide-react';

interface Props {
    absences: any;
    filters: { search?: string };
    employees: { id: number; name: string }[];
}

const getEmptyForm = () => ({
    employee_id: '',
    month: '',
    absent_days: '',
    reason: '',
});

export default function Index({ absences, filters, employees }: Props) {
    const { t } = useTranslation();

    const [search, setSearch] = useState(filters?.search || '');
    const [form, setForm] = useState(getEmptyForm());

    const [isOpen, setIsOpen] = useState(false);
    const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

    const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(
        null,
    );
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const resetForm = () => setForm(getEmptyForm());

    const openCreateModal = () => {
        setEditingAbsence(null);
        resetForm();
        setForm((f) => ({ ...f, month: new Date().toISOString().slice(0, 7) })); // Default to current month
        setIsOpen(true);
    };

    const openEditModal = (absence: Absence) => {
        setEditingAbsence(absence);
        setForm({
            employee_id: absence.employee_id ? String(absence.employee_id) : '',
            month: absence.month ?? '',
            absent_days: String(absence.absent_days ?? ''),
            reason: absence.reason,
        });
        setIsOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();
        fd.append('employee_id', form.employee_id);
        fd.append('month', form.month);
        fd.append('absent_days', form.absent_days);
        fd.append('reason', form.reason);

        if (editingAbsence) {
            fd.append('_method', 'PUT');
            router.post(route('absences.update', editingAbsence.id), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success('Employee Absence updated successfully');
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Error updating absence');
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route('absences.store'), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success('Employee Absence created successfully');
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Error creating absence');
                },
                onFinish: () => setProcessing(false),
            });
        }
    };

    const handleDelete = (absence: Absence) => {
        setDeletingAbsence(absence);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingAbsence) return;
        router.delete(route('absences.destroy', deletingAbsence.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingAbsence(null);
                toast.success('Employee Absence deleted successfully');
            },
        });
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                '/absences',
                {
                    search: search || undefined,
                    page: 1,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    const applyFilter = () => {
        router.get(
            '/absences',
            {
                search: search || undefined,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const columns = buildColumns(openEditModal, handleDelete);

    return (
        <>
            <Head title="Employee Absences" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold">
                            {t('absence.absence_title')}
                        </h1>

                        <Button
                            className="bg-indigo-800 hover:bg-indigo-700"
                            onClick={openCreateModal}
                        >
                            <PlusIcon className="size-4" />
                            {t('absence.add_new')}
                        </Button>
                    </div>

                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                        placeholder={t('absence.search_placeholder')}
                    />

                    <DataTable columns={columns} data={absences.data} />

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {absences.from} to {absences.to} of{' '}
                            {absences.total}
                        </div>

                        <div className="flex gap-1">
                            {absences.links.map((link: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (link.url) {
                                            router.get(
                                                link.url,
                                                {},
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }
                                    }}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded border px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white hover:bg-gray-50'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditingAbsence(null);
                        resetForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <form onSubmit={submit} encType="multipart/form-data">
                        <DialogHeader className="mb-4">
                            <DialogTitle>
                                {editingAbsence
                                    ? t('absence.edit_absence')
                                    : t('absence.create_new')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingAbsence
                                    ? 'Update employee absence record'
                                    : 'Add new employee absence record'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Employee Name */}
                            <div className="space-y-1">
                                <Label htmlFor="name">
                                    {t('absence.employee_name')}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={form.employee_id}
                                    onValueChange={(value) =>
                                        setForm((f) => ({
                                            ...f,
                                            employee_id: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={t(
                                                'absence.select_employee',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees?.map((employee) => (
                                            <SelectItem
                                                key={employee.id}
                                                value={String(employee.id)}
                                            >
                                                {employee.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.employee_id && (
                                    <p className="text-xs text-red-500">
                                        {errors.employee_id}
                                    </p>
                                )}
                            </div>

                            {/* Month */}
                            <div className="space-y-1">
                                <Label htmlFor="month">
                                    {t('absence.month')}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={form.month}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            month: e.target.value,
                                        }))
                                    }
                                />
                                {errors.month && (
                                    <p className="text-xs text-red-500">
                                        {errors.month}
                                    </p>
                                )}
                            </div>

                            {/* Absent Days */}
                            <div className="space-y-1">
                                <Label htmlFor="absent_days">
                                    {t('absence.absence_day')}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="absent_days"
                                    type="number"
                                    min="0"
                                    max="31"
                                    value={form.absent_days}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            absent_days: e.target.value,
                                        }))
                                    }
                                />
                                {errors.absent_days && (
                                    <p className="text-xs text-red-500">
                                        {errors.absent_days}
                                    </p>
                                )}
                            </div>

                            {/* Reason */}
                            <div className="space-y-1">
                                <Label htmlFor="reason">
                                    {t('absence.reason')}
                                </Label>
                                <Input
                                    id="reason"
                                    type="text"
                                    value={form.reason}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            reason: e.target.value,
                                        }))
                                    }
                                />
                                {errors.reason && (
                                    <p className="text-xs text-red-500">
                                        {errors.reason}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                {t('absence.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-indigo-800 hover:bg-indigo-700"
                            >
                                {processing
                                    ? 'Saving...'
                                    : editingAbsence
                                      ? t('absence.update')
                                      : t('absence.create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('absence.delete_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('absence.delete_description')} "
                            {deletingAbsence?.employee_name}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setDeletingAbsence(null)}
                        >
                            {t('absence.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('absence.delete_button')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'absence.absence_title', href: '/absences' }],
};
