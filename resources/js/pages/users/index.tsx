import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useRef, ChangeEvent } from 'react';
import { route } from 'ziggy-js';
import { t } from 'i18next';

import { buildColumns, User } from "./columns";
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
    users: User[];
    availableRoles: string[];
}

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    status: '',
    photo: null as File | null,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Index({ users, availableRoles }: Props) {

    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Delete state
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
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
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openCreateModal = () => {
        setEditingUser(null);
        resetForm();
        setForm(f => ({ ...f, status: 'active' }));
        setIsOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setForm({
            name: user.name ?? '',
            email: String(user.email ?? ''),
            password: '',
            password_confirmation: '',
            // If user has roles from Spatie, grab the first one
            role: user.roles?.[0]?.name ?? user.role ?? '',
            status: user.status ?? '',
            photo: null,
        });

        // ✅ show existing image
        if (user.photo) {
            setPreview(`/storage/${user.photo}`);
        }

        setIsOpen(true);
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('email', form.email);
        fd.append('password', form.password);
        fd.append('password_confirmation', form.password_confirmation);
        fd.append('role', form.role);
        fd.append('status', form.status);

        if (form.photo) {
            fd.append('photo', form.photo);
        }

        if (editingUser) {
            fd.append('_method', 'PUT');
            router.post(route('users.update', editingUser.id), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    router.reload({ only: ['users'] });
                    toast.success('User updated successfully!');
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Please fix the errors and try again.');
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route('users.store'), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    router.reload({ only: ['users'] });
                    toast.success('User created successfully!');
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

    const handleDelete = (user: User) => {
        setDeletingUser(user);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingUser) return;
        router.delete(route('users.destroy', deletingUser.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingUser(null);
                router.reload({ only: ['users'] });
                toast.success(`"${deletingUser.name}" deleted successfully!`);
            },
            onError: () => toast.error('Failed to delete user. Please try again.'),
        });
    };

    // ── Table columns (with callbacks wired) ─────────────────────────────────

    const columns = buildColumns(openEditModal, handleDelete);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('user.all_user')}</h1>
                        <Button className="bg-indigo-800 hover:bg-indigo-700" onClick={openCreateModal}>
                            {t('user.add_user')}
                        </Button>
                    </div>

                    <div className="py-4">
                        <DataTable columns={columns} data={users} />
                    </div>
                </div>
            </div>

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { setEditingUser(null); resetForm(); }
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <form onSubmit={submit} encType="multipart/form-data">
                        <DialogHeader className="mb-4">
                            <DialogTitle>{editingUser ? t('user.update_user') : t('user.add_user')}</DialogTitle>
                            <DialogDescription>
                                {editingUser ? t('user.edit_new_title') : t('user.add_new_title')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">

                            {/* Photo Upload */}
                            {/* Drag & Drop Photo Upload */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
                                ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"}`}

                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);

                                    const file = e.dataTransfer.files?.[0];

                                    if (!file.type.startsWith("image/")) {
                                        alert("Only images allowed");
                                        return;
                                    }

                                    if (!file) return;

                                    setForm(f => ({ ...f, photo: file }));
                                    setPreview(URL.createObjectURL(file));
                                }}

                                onClick={() => fileInputRef.current?.click()}
                            >

                                <p className="text-sm text-gray-500">
                                    {t('user.drag_and_drop')} <span className="text-indigo-600 font-medium">{t('user.click_to_upload')}</span>
                                </p>

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    hidden
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        const file = e.target.files?.[0];

                                        if (!file.type.startsWith("image/")) {
                                            alert("Only images allowed");
                                            return;
                                        }

                                        if (!file) return;

                                        setForm(f => ({ ...f, photo: file }));
                                        setPreview(URL.createObjectURL(file));
                                    }}
                                />

                                {/* Preview */}
                                {preview && (
                                    <div className="mt-4 flex justify-center">
                                        <img
                                            src={preview}
                                            className="w-24 h-24 rounded-full object-cover border shadow"
                                        />
                                    </div>
                                )}

                                {preview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreview(null);
                                            setForm(f => ({ ...f, photo: null }));
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="mt-2 text-sm text-red-500 hover:underline"
                                    >
                                        {t('user.remove_image')}
                                    </button>
                                )}

                            </div>

                            {/* User Name */}
                            <div className="space-y-1">
                                <Label htmlFor="name">{t('user.name')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Vanilla Ice Cream"
                                />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                            </div>


                            {/* User Email */}
                            <div className="space-y-1">
                                <Label htmlFor="email">{t('user.email')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="e.g. [EMAIL_ADDRESS]"
                                />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                            </div>

                            {/* User Role*/}
                            <div className="space-y-1">
                                <Label htmlFor="role">{t('user.role')} <span className="text-red-500">*</span></Label>
                                <Select
                                    value={form.role}
                                    onValueChange={v => setForm(f => ({ ...f, role: v }))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Map through the roles passed from Laravel */}
                                        {availableRoles.map((roleName) => (
                                            <SelectItem key={roleName} value={roleName}>
                                                {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
                            </div>

                            {!editingUser && (
                                <>
                                    {/* Password */}
                                    <div className="space-y-1">
                                        <Label>{t('user.password')} <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="password"
                                            value={form.password}
                                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                            placeholder="Enter password"
                                        />
                                        {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1">
                                        <Label>{t('user.confirm_password')} <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="password"
                                            value={form.password_confirmation}
                                            onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                            placeholder="Confirm password"
                                        />
                                    </div>

                                </>
                            )}


                            {/* Product Status */}
                            <div className="space-y-1">
                                <Label>{t('user.status')} <span className="text-red-500">*</span></Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('user.active')}</SelectItem>
                                        <SelectItem value="inactive">{t('user.inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
                            </div>


                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                {t('user.close')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {processing ? t('user.save_processing') : (editingUser ? t('user.update_user') : t('user.create_user'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('user.delete_user')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('user.delete_description')}
                            <span className="font-semibold text-foreground">"{deletingUser?.name}"</span>{' '}
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingUser(null)}>{t('user.cancel')}</AlertDialogCancel>
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
        { title: 'Users', href: '/users' },
    ],
};
