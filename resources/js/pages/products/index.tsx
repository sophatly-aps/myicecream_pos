import { Head, router, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useRef, ChangeEvent } from 'react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';

import { buildColumns, Product } from "./columns";
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

interface Category {
    id: number;
    name: string;
}

interface Props {
    products: Product[];
    categories: Category[];
    settings: Record<string, string>;
}

const EMPTY_FORM = {
    name: '',
    category_id: '',
    unit: '',
    base_price: '',
    selling_price: '',
    status: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Index({ products, categories, settings }: Props) {

    const { t } = useTranslation();

    const currency = settings?.currency_symbol || '$';

    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Delete state
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Form state (managed manually — not useForm — because image is a File)
    const [form, setForm] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
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
        setEditingProduct(null);
        resetForm();
        setForm(f => ({ ...f, status: 'active' }));
        setIsOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setForm({
            name: product.name ?? '',
            category_id: String(product.category_id ?? ''),
            unit: (product as any).unit ?? '',
            base_price: product.base_price != null ? String(product.base_price) : '',
            selling_price: product.selling_price != null ? String(product.selling_price) : '',
            status: product.status,
        });
        setImageFile(null);
        setImagePreview(product.image ?? null);
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
        fd.append('category_id', form.category_id);
        fd.append('unit', form.unit);
        fd.append('base_price', form.base_price);
        fd.append('selling_price', form.selling_price);
        fd.append('status', form.status);
        if (imageFile) fd.append('image', imageFile);

        if (editingProduct) {
            fd.append('_method', 'PUT');
            router.post(route('products.update', editingProduct.id), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success('Product updated successfully!');
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Please fix the errors and try again.');
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route('products.store'), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success('Product created successfully!');
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

    const handleDelete = (product: Product) => {
        setDeletingProduct(product);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingProduct) return;
        router.delete(route('products.destroy', deletingProduct.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingProduct(null);
                toast.success(`"${deletingProduct.name}" deleted successfully!`);
            },
            onError: (errs) => {
                setIsDeleteOpen(false);
                setDeletingProduct(null);
                if (errs.product) {
                    toast.error(errs.product);
                } else {
                    toast.error('Failed to delete product. Please try again.');
                }
            },
        });
    };

    // ── Table columns (with callbacks wired) ─────────────────────────────────

    const columns = buildColumns(openEditModal, handleDelete, currency);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Products" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('products.all_product')}</h1>
                        <Button className="bg-indigo-800 hover:bg-indigo-700" onClick={openCreateModal}>
                            {t('products.add_product')}
                        </Button>
                    </div>

                    <div className="py-4">
                        <DataTable columns={columns} data={products} />
                    </div>
                </div>
            </div>

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { setEditingProduct(null); resetForm(); }
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <form onSubmit={submit} encType="multipart/form-data">
                        <DialogHeader className="mb-4">
                            <DialogTitle>{editingProduct ? t('products.edit_product') : t('products.add_product')}</DialogTitle>
                            <DialogDescription>
                                {editingProduct ? t('products.edit_product_description') : t('products.add_product_description')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">

                            {/* Product Name */}
                            <div className="space-y-1">
                                <Label htmlFor="name">{t('products.product_name')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Vanilla Ice Cream"
                                />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </div>

                            {/* Category */}
                            <div className="space-y-1">
                                <Label>{t('products.category')} <span className="text-red-500">*</span></Label>
                                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && <p className="text-red-500 text-xs">{errors.category_id}</p>}
                            </div>

                            {/* Unit */}
                            <div className="space-y-1">
                                <Label htmlFor="unit">{t('products.unit')}</Label>
                                <Input
                                    id="unit"
                                    value={form.unit}
                                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                />
                            </div>

                            {/* Prices row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="base_price">{t('products.base_price')}</Label>
                                    <Input
                                        id="base_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.base_price}
                                        onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                                    />
                                    {errors.base_price && <p className="text-red-500 text-xs">{errors.base_price}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="selling_price">{t('products.selling_price')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="selling_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.selling_price}
                                        onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))}
                                        placeholder="0.00"
                                    />
                                    {errors.selling_price && <p className="text-red-500 text-xs">{errors.selling_price}</p>}
                                </div>



                            </div>

                            {/* Product Status */}
                            <div className="space-y-1 w-full">
                                <Label>{t('products.status_label')} <span className="text-red-500">*</span></Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('products.status.active')}</SelectItem>
                                        <SelectItem value="inactive">{t('products.status.inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="image">{t('products.image')}</Label>
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
                                            {t('products.remove')}
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
                                {t('products.cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {processing ? t('products.save_processing') : (editingProduct ? t('products.update') : t('products.create'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('products.delete_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('products.delete_description')}{' '}
                            <span className="font-semibold text-foreground">"{deletingProduct?.name}"</span>{' '}
                            {t('products.delete_image')} {t('products.delete_confirmation_description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingProduct(null)}>{t('products.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('products.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'products.product_label', href: '/products' },
    ],
};
