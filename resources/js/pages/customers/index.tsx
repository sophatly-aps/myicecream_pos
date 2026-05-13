import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { route } from 'ziggy-js';

import { buildColumns, Customer } from "./columns";
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

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
    customers: any;
    filters: { search?: string };
}

const EMPTY_FORM = {
    name: '',
    phone: '',
    address: '',
    other_info: '',
    status: '',
};

const getEmptyForm = () => ({
    name: '',
    phone: '',
    address: '',
    other_info: '',
    status: '',
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function Index({ customers, filters }: Props) {

    const { t } = useTranslation();

    const [search, setSearch] = useState(filters?.search || '');
    const [form, setForm] = useState(getEmptyForm());


    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Delete state
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Form state (managed manually — not useForm — because image is a File)
    // const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const resetForm = () => {
        setForm(getEmptyForm());
    };

    const openCreateModal = () => {
        setEditingCustomer(null);
        resetForm();
        setForm(f => ({ ...f, status: 'active' }));
        setIsOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setForm({
            name: customer.name ?? '',
            phone: String(customer.phone ?? ''),
            address: (customer as any).address ?? '',
            other_info: customer.other_info != null ? String(customer.other_info) : '',
            status: customer.status,
        });
        setIsOpen(true);
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('phone', form.phone);
        fd.append('address', form.address);
        fd.append('other_info', form.other_info);
        fd.append('status', form.status);

        if (editingCustomer) {
            fd.append('_method', 'PUT');
            router.post(route('customers.update', editingCustomer.id), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success(t('depot.update_success'));
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error(t('depot.error_please_try'));
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route('customers.store'), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success(t('depot.create_success'));
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error(t('depot.error_please_try'));
                },
                onFinish: () => setProcessing(false),
            });
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = (customer: Customer) => {
        setDeletingCustomer(customer);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingCustomer) return;
        router.delete(route('customers.destroy', deletingCustomer.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingCustomer(null);
                toast.success(`"${deletingCustomer.name}" deleted successfully!`);
            },
            onError: (errors: any) => {
                if (errors.delete) {
                    toast.error(errors.delete);
                } else {
                    toast.error(t('depot.error_please_try'));
                }
            }
        });
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get('/customers', {
                search: search || undefined,
                page: 1 // reset ONLY when typing
            }, {
                preserveState: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    const applyFilter = () => {
        router.get('/customers', {
            search: search || undefined,
            page: 1
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // ── Table columns (with callbacks wired) ─────────────────────────────────

    const columns = buildColumns(openEditModal, handleDelete);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Products" />


            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('depot.all_depot')}</h1>
                        <Button className="bg-indigo-800 hover:bg-indigo-700" onClick={openCreateModal}>
                            {t('depot.add_depot')}
                        </Button>
                    </div>

                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />

                    <DataTable columns={columns} data={customers.data} />

                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-500">
                            Showing {customers.from} to {customers.to} of {customers.total}
                        </div>

                        <div className="flex gap-1">
                            {customers.links.map((link: any, i: number) => (
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
                if (!open) { setEditingCustomer(null); resetForm(); }
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <form onSubmit={submit} encType="multipart/form-data">
                        <DialogHeader className="mb-4">
                            <DialogTitle>{editingCustomer ? t('depot.edit_depot') : t('depot.add_depot')}</DialogTitle>
                            <DialogDescription>
                                {editingCustomer ? t('depot.edit_description') : t('depot.add_description')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">

                            {/* Product Name */}
                            <div className="space-y-1">
                                <Label htmlFor="name">{t('depot.name_label')}<span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Vanilla Ice Cream"
                                />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </div>


                            {/* Phone */}
                            <div className="space-y-1">
                                <Label htmlFor="phone">{t('depot.phone_label')}<span className="text-red-500">*</span></Label>
                                <Input
                                    id="phone"
                                    type="text"
                                    value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="e.g. 012345678"
                                />
                                {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                            </div>

                            {/* Address row */}
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <Label htmlFor="address">{t('depot.address_label')}</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={form.address}
                                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    />

                                </div>
                            </div>

                            {/* Other info */}
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <Label htmlFor="other_info">{t('depot.other_info')}</Label>
                                    <Input
                                        id="other_info"
                                        name="other_info"
                                        type="text"
                                        value={form.other_info}
                                        onChange={e => setForm(f => ({ ...f, other_info: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Product Status */}
                            <div className="space-y-1">
                                <Label>{t('depot.status_label')} <span className="text-red-500">*</span></Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('depot.status.active')}</SelectItem>
                                        <SelectItem value="inactive">{t('depot.status.inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
                            </div>


                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                {t('depot.cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {processing ? t('depot.save_processing') : (editingCustomer ? t('depot.update') : t('depot.create'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('depot.delete')}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('depot.delete_description')} {' '}
                            <span className="font-semibold text-foreground">"{deletingCustomer?.name}"</span>{' '}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingCustomer(null)}>{t('depot.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('depot.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: ('depot.depot_label'), href: '/customers' },
    ],
};
