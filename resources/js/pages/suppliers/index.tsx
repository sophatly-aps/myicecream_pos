import { Head, useForm, router } from '@inertiajs/react';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from 'react'; // Added FormEvent type
import { route } from 'ziggy-js';
import { Field, FieldGroup } from '@/components/ui/field';

// 1. Define what a Category looks like
interface Supplier {
    id: number;
    name: string;
    phone: string;
    address: string;
    status: string;
    other_info: string;
    created_at: string;
}

// 2. Define the Props for your component
interface Props {
    suppliers: Supplier[];
}

export default function Index({ suppliers }: Props) {

    const { t } = useTranslation();

    // Inside your Index component
    const [isOpen, setIsOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        phone: '',
        address: '',
        status: 'active',
        other_info: '',
    });

    const openCreateModal = () => {
        setEditingSupplier(null);
        reset();                  // Clear the input values
        clearErrors();            // Remove any old red error messages
        setIsOpen(true);
    };

    const openEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        // Fill the form with existing data
        setData({
            name: supplier.name,
            phone: supplier.phone,
            address: supplier.address,
            status: supplier.status,
            other_info: supplier.other_info,
        });
        clearErrors();
        setIsOpen(true);
    };


    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSupplier) {
            put(route('suppliers.update', editingSupplier.id), {
                onSuccess: () => {
                    setIsOpen(false);
                    reset();
                    toast.success('Supplier updated successfully!');
                },
                onError: () => {
                    toast.error('Failed to update supplier. Please check the form.');
                }
            });
        } else {
            post(route('suppliers.store'), {
                onSuccess: () => {
                    setIsOpen(false);
                    // Explicitly clear all fields after successful creation
                    setData({
                        name: '',
                        phone: '',
                        address: '',
                        status: 'active',
                        other_info: '',
                    });
                    clearErrors();
                    toast.success('Supplier created successfully!');
                },
                onError: () => {
                    toast.error('Failed to create supplier. Please check the form.');
                }
            });
        }
    };

    const handleDelete = (supplier: Supplier) => {
        setDeletingSupplier(supplier);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingSupplier) return;
        router.delete(route('suppliers.destroy', deletingSupplier.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingSupplier(null);
                toast.success(`"${deletingSupplier.name}" deleted successfully!`);
            },
            onError: () => {
                toast.error('Failed to delete category. Please try again.');
            },
        });
    };

    return (
        <>
            <Head title="Categories" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('supplier.all_suppliers')}</h1>
                        <Button
                            className="bg-indigo-800 hover:bg-indigo-700"
                            onClick={openCreateModal}
                        >
                            {t('supplier.add_supplier')}
                        </Button>
                    </div>

                    {/* 2. Grid for Categories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                                <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="aspect-video bg-indigo-100 flex items-center justify-center">
                                        {/* Placeholder for category image or icon */}
                                        <span className="text-4xl font-bold text-indigo-300">
                                            <img src="images/logo.png" className="w-full h-full object-cover" alt={supplier.name} />
                                        </span>
                                    </div>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl">{supplier.name}</CardTitle>
                                            <Badge
                                                variant={supplier.status === 'active' ? 'default' : 'destructive'}
                                                className={supplier.status === 'active' ? 'bg-green-600 hover:bg-green-500' : ''}
                                            >
                                                {supplier.status === 'active' ? t('supplier.status.active') : t('supplier.status.inactive')}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p><strong>{t('supplier.phone')}</strong> {supplier.phone}</p>
                                        <p><strong>{t('supplier.address')}</strong> {supplier.address ? supplier.address : 'មិនមាន'}</p>
                                        <p><strong>{t('supplier.other_info')}</strong> {supplier.other_info ? supplier.other_info : 'មិនមាន'}</p>
                                    </CardContent>
                                    <CardFooter className="border-t pt-4 flex gap-2">
                                        <Button variant="outline" className="w-full" onClick={() => openEditModal(supplier)}>{t('supplier.update')}</Button>
                                        <Button variant="destructive" className="w-full" onClick={() => handleDelete(supplier)}>{t('supplier.delete')}</Button>
                                    </CardFooter>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
                                <p className="text-gray-500 text-lg">No categories found. Start by adding one!</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <Dialog open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditingSupplier(null);
                        reset();
                    }
                }}>
                <DialogContent className="sm:max-w-sm">
                    <form onSubmit={submit}>
                        <DialogHeader className="mb-4">
                            <DialogTitle>
                                {editingSupplier ? t('supplier.edit_supplier') : t('supplier.add_supplier')}
                            </DialogTitle>
                            <DialogDescription>
                                {/* {editingSupplier ? t('supplier.edit_supplier_description') : t('supplier.add_supplier_description')} */}
                            </DialogDescription>
                        </DialogHeader>

                        <FieldGroup>
                            <Field>
                                <Label>{t('supplier.name_label')}</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </Field>

                            <Field>
                                <Label>{t('supplier.phone')}</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                />
                                {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                            </Field>

                            <Field>
                                <Label>{t('supplier.address')}</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                />

                            </Field>

                            <Field>
                                <Label>{t('supplier.other_info')}</Label>
                                <Input
                                    id="other_info"
                                    name="other_info"
                                    value={data.other_info}
                                    onChange={e => setData('other_info', e.target.value)}
                                />
                            </Field>

                            <Field className="mt-2">
                                <Label>{t('supplier.status_label')}</Label>
                                <Select name="status" value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('supplier.status.active')}</SelectItem>
                                        <SelectItem value="inactive">{t('supplier.status.inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                            </Field>
                        </FieldGroup>

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                {t('supplier.cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {editingSupplier ? t('supplier.update') : t('supplier.add_supplier')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('supplier.delete_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('supplier.delete_description')}{' '}
                            <span className="font-semibold text-foreground">"{deletingSupplier?.name}"</span>.
                            {t('supplier.delete_cannot_undo')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingSupplier(null)}>{t('supplier.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('supplier.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


