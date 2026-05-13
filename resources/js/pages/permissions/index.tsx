import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { route } from "ziggy-js";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Index({ permissions }: any) {
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<any>(null);
    const [name, setName] = useState("");
    const [search, setSearch] = useState("");

    // Group permissions by their prefix (e.g., 'users.view' -> 'users')
    const groupedPermissions = useMemo(() => {
        const filtered = permissions.filter((p: any) =>
            p.name.toLowerCase().includes(search.toLowerCase())
        );

        return filtered.reduce((acc: any, perm: any) => {
            const [group] = perm.name.split(".");
            if (!acc[group]) acc[group] = [];
            acc[group].push(perm);
            return acc;
        }, {});
    }, [permissions, search]);

    const submit = () => {
        const payload = {
            name,
        };

        if (editingPermission) {
            router.put(route("permissions.update", editingPermission.id), payload, {
                onSuccess: () => {
                    setOpen(false);
                    setEditingPermission(null);
                    setName("");
                }
            });
        } else {
            router.post(route("permissions.store"), payload, {
                onSuccess: () => {
                    setOpen(false);
                    setName("");
                }
            });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">{t('permissions.title', 'Permissions')}</h1>

                <Button onClick={() => {
                    setEditingPermission(null);
                    setName("");
                    setOpen(true);
                }}>{t('permissions.add', 'Add Permission')}</Button>
            </div>

            <Input
                placeholder={t('permissions.search', 'Search permission...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md mb-6"
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(groupedPermissions).map(([group, perms]: any) => (
                    <div key={group} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-lg capitalize">{group}</h2>
                        </div>

                        <div className="flex flex-col gap-2">
                            {perms.map((p: any) => (
                                <div key={p.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md border border-gray-100">
                                    <span className="text-sm text-gray-700">
                                        {p.name}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" onClick={() => {
                                            setEditingPermission(p);
                                            setName(p.name);
                                            setOpen(true);
                                        }}>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>

                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-800 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm(t('permissions.delete_confirm', 'Are you sure you want to delete this permission?'))) {
                                                    router.delete(route("permissions.destroy", p.id));
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedPermissions).length === 0 && (
                    <div className="col-span-full py-8 text-center text-gray-500">
                        {t('permissions.no_results', 'No permissions found.')}
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold">
                            {editingPermission ? t('permissions.edit', 'Edit Permission') : t('permissions.create', 'Create Permission')}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {t('permissions.form_description', 'Enter the permission name (e.g., users.view)')}
                        </p>
                    </div>

                    <Input
                        placeholder={t('permissions.name_placeholder', 'Permission name')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />

                    <div className="flex justify-end mt-6 gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            {t('permissions.cancel', 'Cancel')}
                        </Button>

                        <Button onClick={submit} className="bg-indigo-600 hover:bg-indigo-700" disabled={!name.trim()}>
                            {t('permissions.save', 'Save Permission')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
