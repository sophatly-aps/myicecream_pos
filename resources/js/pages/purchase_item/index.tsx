import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useRef, ChangeEvent } from 'react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';

import { buildColumns, PurchaseItem, Supplier } from "./columns";
import { DataTable } from "./data-table";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
    purchase_items: PurchaseItem[];
    suppliers: Supplier[];
}

const EMPTY_FORM = {
    supplier_id: '',
    name: '',
    unit: '',
    price: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Index({ purchase_items, suppliers }: Props) {

    const { t } = useTranslation();

    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [editingPurchaseItem, setEditingPurchaseItem] = useState<PurchaseItem | null>(null);

    // Delete state
    const [deletingPurchaseItem, setDeletingPurchaseItem] = useState<PurchaseItem | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Form state (managed manually — not useForm — because image is a File)
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setImageFile(null);
        setImagePreview(null);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openCreateModal = () => {
        setEditingPurchaseItem(null);
        resetForm();
        setIsOpen(true);
    };

    const openEditModal = (purchase_item: PurchaseItem) => {
        setEditingPurchaseItem(purchase_item);
        setForm({
            supplier_id: String(purchase_item.supplier_id ?? ''),
            name: purchase_item.name ?? '',
            unit: String(purchase_item.unit ?? ''),
            price: purchase_item.price != null ? String(purchase_item.price) : '',
        });
        setImageFile(null);
        setImagePreview(purchase_item.image ?? null);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsOpen(true);
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImageFile(file);
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('unit', form.unit);
        fd.append('price', form.price);
        fd.append('supplier_id', form.supplier_id);

        if (imageFile) fd.append('image', imageFile);

        if (editingPurchaseItem) {
            fd.append('_method', 'PUT');
            router.post(route('purchase-item.update', editingPurchaseItem.id), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success(t('purchase_item.purchase_item_updated'));
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Please fix the errors and try again.');
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route('purchase-item.store'), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success(t('purchase_item.purchase_item_created'));
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

    const handleDelete = (purchase_item: PurchaseItem) => {
        setDeletingPurchaseItem(purchase_item);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingPurchaseItem) return;
        router.delete(route('purchase-item.destroy', deletingPurchaseItem.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingPurchaseItem(null);
                toast.success(`"${deletingPurchaseItem.name}" deleted successfully!`);
            },
            onError: () => toast.error('Failed to delete purchase item. Please try again.'),
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
                        <h1 className="text-2xl font-bold">{t('purchase_item.all_purchase_items')}</h1>
                        <Button className="bg-indigo-800 hover:bg-indigo-700" onClick={openCreateModal}>
                            {t('purchase_item.add_purchase_item')}
                        </Button>
                    </div>

                    <div className="py-4">
                        <DataTable columns={columns} data={purchase_items} />
                    </div>
                </div>
            </div>

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { setEditingPurchaseItem(null); resetForm(); }
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <form onSubmit={submit} encType="multipart/form-data">
                        <DialogHeader className="mb-4">
                            <DialogTitle>{editingPurchaseItem ? t('purchase_item.edit_purchase_item') : t('purchase_item.add_purchase_item')}</DialogTitle>
                            <DialogDescription>
                                {/* {editingPurchaseItem ? t('purchase_item.edit_description') : t('purchase_item.add_description')} */}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">

                            {/* Supplier Name */}
                            <div className="space-y-1">
                                <Label htmlFor="supplier_id">{t('purchase_item.supplier')} <span className="text-red-500">*</span></Label>
                                <Select
                                    value={form.supplier_id}
                                    onValueChange={e => setForm(f => ({ ...f, supplier_id: e }))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(supplier => (
                                            <SelectItem key={supplier.id} value={String(supplier.id)}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="text-red-500 text-xs">{errors.supplier_id}</p>}
                            </div>

                            {/* Product Name */}
                            <div className="space-y-1">
                                <Label htmlFor="name">{t('purchase_item.purchase_item_name')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </div>


                            {/* Unit */}
                            <div className="space-y-1">
                                <Label htmlFor="unit">{t('purchase_item.unit')}</Label>
                                <Input
                                    id="unit"
                                    type="text"
                                    value={form.unit}
                                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                />
                                {errors.unit && <p className="text-red-500 text-xs">{errors.unit}</p>}
                            </div>

                            {/* Price row */}
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <Label htmlFor="price">{t('purchase_item.price')}</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="text"
                                        value={form.price}
                                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                    />

                                </div>
                                {errors.price && <p className="text-red-500 text-xs">{errors.price}</p>}

                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="image">{t('purchase_item.image')}</Label>
                                {imagePreview && (
                                    <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-gray-50">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded px-2 py-0.5 hover:bg-red-600"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                        >
                                            {t('purchase_item.remove')}
                                        </button>
                                    </div>
                                )}
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-gray-500">JPEG, PNG, WebP — max 2MB</p>
                                {errors.image && <p className="text-red-500 text-xs">{errors.image}</p>}
                            </div>


                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                {t('purchase_item.cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {processing ? t('purchase_item.save_processing') : (editingPurchaseItem ? t('purchase_item.update') : t('purchase_item.create'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('purchase_item.delete_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('purchase_item.delete_description')}
                            <span className="font-semibold text-foreground">"{deletingPurchaseItem?.name}"</span>{' '}
                            {t('purchase_item.delete_cannot_undo')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingPurchaseItem(null)}>{t('purchase_item.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('purchase_item.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Purchase Item', href: '/purchase_item' },
    ],
};
