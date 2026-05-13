import { Head, useForm, router } from '@inertiajs/react';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';


import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { useState, useEffect, FormEvent } from 'react'; // Added FormEvent type
import { route } from 'ziggy-js';
import { Field, FieldGroup } from '@/components/ui/field';

// 1. Define what a Category looks like
interface Category {
    id: number;
    name: string;
    status: string;
    created_at: string;
}

// 2. Define the Props for your component
interface Props {
    categories: Category[];
}

export default function Index({ categories }: Props) {

    const { t } = useTranslation();

    // Inside your Index component
    const [isOpen, setIsOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        status: 'active',
    });

    const openCreateModal = () => {
        setEditingCategory(null); // IMPORTANT: Clear the edit state
        reset();                  // Clear the input values
        clearErrors();            // Remove any old red error messages
        setIsOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        // Fill the form with existing data
        setData({
            name: category.name,
            status: category.status,
        });
        clearErrors();
        setIsOpen(true);
    };


    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategory) {
            // EDIT MODE: Use PUT request
            put(route('categories.update', editingCategory.id), {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('កែប្រែប្រភេទការ៉េមជោគជ័យ!'); // Success message in Khmer
                },
                onError: () => {
                    toast.error('មានបញ្ហាក្នុងការកែប្រែ! សូមពិនិត្យឡើងវិញ។'); // Error message in Khmer
                }
            });
        } else {
            // CREATE MODE: Use POST request
            post(route('categories.store'), {
                onSuccess: () => {
                    setIsOpen(false);
                    reset();
                    toast.success('បង្កើតប្រភេទការ៉េមថ្មីជោគជ័យ!');
                },
                onError: () => {
                    toast.error('មានបញ្ហាក្នុងការបង្កើត! សូមពិនិត្យឡើងវិញ។');
                }
            });
        }
    };

    const handleDelete = (category: Category) => {
        setDeletingCategory(category);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingCategory) return;
        router.delete(route('categories.destroy', deletingCategory.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingCategory(null);
                toast.success(`"${deletingCategory.name}" deleted successfully!`);
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
                        <h1 className="text-2xl font-bold">{t('category.all_category')}</h1>
                        <Button
                            className="bg-indigo-800 hover:bg-indigo-700"
                            onClick={openCreateModal}
                        >
                            {t('category.add_category')}
                        </Button>
                    </div>

                    {/* 2. Grid for Categories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categories.length > 0 ? (
                            categories.map((category) => (
                                <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="aspect-video bg-indigo-100 flex items-center justify-center">
                                        {/* Placeholder for category image or icon */}
                                        <span className="text-4xl font-bold text-indigo-300">
                                            <img src="images/logo.png" className="w-full h-full object-cover" alt={category.name} />
                                        </span>
                                    </div>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl">{category.name}</CardTitle>
                                            <Badge
                                                variant={category.status === 'active' ? 'default' : 'destructive'}
                                                className={category.status === 'active' ? 'bg-green-600 hover:bg-green-500' : ''}
                                            >
                                                {category.status === 'active' ? (t('category.status.active')) : (t('category.status.inactive'))}
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            {category.created_at}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="border-t pt-4 flex gap-2">
                                        <Button variant="outline" className="w-full" onClick={() => openEditModal(category)}>{t('category.update')}</Button>
                                        <Button variant="destructive" className="w-full" onClick={() => handleDelete(category)}>{t('category.delete')}</Button>
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
                        setEditingCategory(null);
                        reset();
                    }
                }}>
                <DialogContent className="sm:max-w-sm">
                    <form onSubmit={submit}>
                        <DialogHeader className="mb-4">
                            <DialogTitle>
                                {editingCategory ? t('category.edit_category') : t('category.add_category')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCategory ? t('category.edit_description') : t('category.add_description')}
                            </DialogDescription>
                        </DialogHeader>

                        <FieldGroup>
                            <Field>
                                <Label>{t('category.name_label')}</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </Field>

                            <Field className="mt-2">
                                <Label>{t('category.status_label')}</Label>
                                <Select name="status" value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('category.status.active')}</SelectItem>
                                        <SelectItem value="inactive">{t('category.status.inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                            </Field>
                        </FieldGroup>

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                {t('category.cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {editingCategory ? t('category.update') : t('category.create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('category.delete_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('category.delete_description')}{' '}
                            <span className="font-semibold text-foreground">"{deletingCategory?.name}"</span>.
                            {t('category.delete_cannot_undo')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingCategory(null)}>{t('category.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('category.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        {
            title: 'category.category_label',
            href: '/categories',
        },
    ],
};
