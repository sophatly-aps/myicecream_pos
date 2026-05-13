import { useState } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { route } from "ziggy-js";
import { Pencil, Trash2 } from "lucide-react";

export default function Index({ roles, permissions }: any) {

    const groupedPermissions = permissions.reduce((acc: any, perm: any) => {
        const [group] = perm.name.split(".");
        if (!acc[group]) acc[group] = [];
        acc[group].push(perm.name);
        return acc;
    }, {});

    const [open, setOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    const [name, setName] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const togglePermission = (perm: string) => {
        setSelectedPermissions(prev =>
            prev.includes(perm)
                ? prev.filter(p => p !== perm)
                : [...prev, perm]
        );
    };

    const submit = () => {
        const payload = {
            name,
            permissions: selectedPermissions,
        };

        if (editingRole) {
            router.put(route("roles.update", editingRole.id), payload);
        } else {
            router.post(route("roles.store"), payload, {
                onSuccess: () => {
                    setOpen(false);
                    setName("");
                    setSelectedPermissions([]);

                    router.reload({ only: ["roles"] }); // ✅ refresh roles
                }
            });
        }

        setOpen(false);
        setEditingRole(null);
        setName("");
        setSelectedPermissions([]);
    };

    // ✅ RETURN IS REQUIRED
    return (


        <div className="bg-white rounded-xl shadow-sm p-4">



            <div className="flex justify-between mb-2">
                <h1 className="text-2xl font-bold">Roles</h1>

                <Button onClick={() => setOpen(true)}>Add Role</Button>
            </div>

            <Input
                placeholder="Search permission..."
                onChange={(e) => {
                    const value = e.target.value.toLowerCase();
                    // you can filter groupedPermissions here
                }}
            />


            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {roles.map((role: any) => (
                    <div key={role.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">

                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-semibold text-lg">{role.name}</h2>

                            <div className="flex gap-1">
                                <Button size="icon" variant="outline" onClick={() => {
                                    setEditingRole(role);
                                    setName(role.name);
                                    setSelectedPermissions(role.permissions.map((p: any) => p.name));
                                    setOpen(true);
                                }}>
                                    <Pencil className="w-4 h-4" />
                                </Button>

                                <Button size="icon" variant="destructive"
                                    onClick={() => router.delete(route("roles.destroy", role.id))}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {role.permissions.map((p: any) => (
                                <span key={p.id} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                    {p.name}
                                </span>
                            ))}
                        </div>

                    </div>
                ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogContent className="max-w-3xl">

                            {/* HEADER */}
                            <div className="mb-4">
                                <h2 className="text-xl font-bold">
                                    {editingRole ? "Edit Role" : "Create Role"}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Manage permissions for this role
                                </p>
                            </div>

                            {/* ROLE NAME */}
                            <Input
                                placeholder="Role name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            {/* PERMISSION GROUPS */}
                            <div className="space-y-4 mt-4 max-h-[400px] overflow-auto pr-2">

                                {Object.entries(groupedPermissions).map(([group, perms]: any) => {

                                    const allSelected = perms.every((p: string) =>
                                        selectedPermissions.includes(p)
                                    );

                                    return (
                                        <div key={group} className="border rounded-lg p-3">

                                            {/* GROUP HEADER */}
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-semibold capitalize">
                                                    {group}
                                                </h3>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (allSelected) {
                                                            setSelectedPermissions(prev =>
                                                                prev.filter(p => !perms.includes(p))
                                                            );
                                                        } else {
                                                            setSelectedPermissions(prev => [
                                                                ...new Set([...prev, ...perms]),
                                                            ]);
                                                        }
                                                    }}
                                                >
                                                    {allSelected ? "Unselect All" : "Select All"}
                                                </Button>
                                            </div>

                                            {/* PERMISSIONS */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {perms.map((perm: string) => {
                                                    const checked = selectedPermissions.includes(perm);

                                                    return (
                                                        <label
                                                            key={perm}
                                                            className={`flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer
                                        ${checked
                                                                    ? "bg-indigo-50 border-indigo-300"
                                                                    : "bg-white"
                                                                }`}
                                                        >
                                                            <span className="text-sm capitalize">
                                                                {perm.split(".")[1]}
                                                            </span>

                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => togglePermission(perm)}
                                                                className="accent-indigo-600"
                                                            />
                                                        </label>
                                                    );
                                                })}
                                            </div>

                                        </div>
                                    );
                                })}

                            </div>

                            {/* FOOTER */}
                            <div className="flex justify-end mt-4 gap-2">
                                <Button variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>

                                <Button onClick={submit} className="bg-indigo-600 hover:bg-indigo-700">
                                    Save Role
                                </Button>
                            </div>

                        </DialogContent>
                    </Dialog>
                </DialogContent>
            </Dialog>
        </div>
    );
}