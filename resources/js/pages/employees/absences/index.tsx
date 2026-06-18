import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { route } from 'ziggy-js';

import { buildColumns, Absence } from "./columns";
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
});

export default function Index({ absences, filters, employees }: Props) {
    const { t } = useTranslation();

    const [search, setSearch] = useState(filters?.search || '');
    const [form, setForm] = useState(getEmptyForm());

    const [isOpen, setIsOpen] = useState(false);
    const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

    const [deletingAbsence, setDeletingAbsence] = useState<Absence | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const resetForm = () => setForm(getEmptyForm());

    const openCreateModal = () => {
        setEditingAbsence(null);
        resetForm();
        setForm(f => ({ ...f, month: new Date().toISOString().slice(0, 7) })); // Default to current month
        setIsOpen(true);
    };

    const openEditModal = (absence: Absence) => {
        setEditingAbsence(absence);
        setForm({
            employee_id: absence.employee_id ? String(absence.employee_id) : '',
            month: absence.month ?? '',
            absent_days: String(absence.absent_days ?? ''),
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
            router.get('/absences', {
                search: search || undefined,
                page: 1
            }, {
                preserveState: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    const applyFilter = () => {
        router.get('/absences', {
            search: search || undefined,
            page: 1
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const columns = buildColumns(openEditModal, handleDelete);

    return (
        <>
            <Head title="Employee Absences" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Employee Absences</h1>

                        <Button className="bg-indigo-800 hover:bg-indigo-700" onClick={openCreateModal}>
                            <PlusIcon className="size-4" />
                            New Absence Record
                        </Button>
                    </div>

                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                        placeholder="Search employee..."
                    />

                    <DataTable columns={columns} data={absences.data} />

                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-500">
                            Showing {absences.from} to {absences.to} of {absences.total}
                        </div>

                        <div className="flex gap-1">
                            {absences.links.map((link: any, i: number) => (
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

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { setEditingAbsence(null); resetForm(); }
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <form onSubmit={submit} encType="multipart/form-data">
                        <DialogHeader className="mb-4">
                            <DialogTitle>{editingAbsence ? 'Edit Absence Record' : 'New Absence Record'}</DialogTitle>
                            <DialogDescription>
                                {editingAbsence ? 'Update employee absence record' : 'Add new employee absence record'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Employee Name */}
                            <div className="space-y-1">
                                <Label htmlFor="name">Employee Name<span className="text-red-500">*</span></Label>
                                <Select
                                    value={form.employee_id}
                                    onValueChange={(value) => setForm(f => ({ ...f, employee_id: value }))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select an employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees?.map((employee) => (
                                            <SelectItem key={employee.id} value={String(employee.id)}>
                                                {employee.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.employee_id && <p className="text-red-500 text-xs">{errors.employee_id}</p>}
                            </div>

                            {/* Month */}
                            <div className="space-y-1">
                                <Label htmlFor="month">Month (YYYY-MM)<span className="text-red-500">*</span></Label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={form.month}
                                    onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                                />
                                {errors.month && <p className="text-red-500 text-xs">{errors.month}</p>}
                            </div>

                            {/* Absent Days */}
                            <div className="space-y-1">
                                <Label htmlFor="absent_days">Absent Days<span className="text-red-500">*</span></Label>
                                <Input
                                    id="absent_days"
                                    type="number"
                                    min="0"
                                    max="31"
                                    value={form.absent_days}
                                    onChange={e => setForm(f => ({ ...f, absent_days: e.target.value }))}
                                />
                                {errors.absent_days && <p className="text-red-500 text-xs">{errors.absent_days}</p>}
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {processing ? 'Saving...' : (editingAbsence ? 'Update' : 'Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Absence Record</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this absence record for "{deletingAbsence?.employee_name}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingAbsence(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Employee Absences', href: '/absences' },
    ],
};
