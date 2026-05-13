import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Eye, Printer, User, Phone, MapPin, Pencil, Trash2, Search, Wallet } from 'lucide-react';
import axios from 'axios';
import { t } from 'i18next';

// --- Types & Constants ---
interface Employee {
    id: number;
    name: string;
    position: string | null;
    phone: string | null;
    address: string | null;
    salary: number;
    image: string | null;
}

const emptyForm = { name: '', position: '', phone: '', address: '', salary: '', image: null as File | null };

// --- Sub-Component: Employee Form (Defined OUTSIDE to prevent focus loss) ---
const EmployeeForm = ({ mode, formData, setFormData, imagePreview, handleImageChange, handleSubmit, isSaving }: any) => (
    <div className="space-y-4">
        <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                {imagePreview
                    ? <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    : <User size={40} className="text-gray-300" />
                }
            </div>
            <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800">
                {t('employee.upload_photo')}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('employee.full_name')}</label>
                <Input
                    value={formData.name}
                    onChange={e => setFormData((p: any) => ({ ...p, name: e.target.value }))}
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('employee.position_label')}</label>
                <Input
                    value={formData.position}
                    onChange={e => setFormData((p: any) => ({ ...p, position: e.target.value }))}
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('employee.phone_label')}</label>
                <Input
                    value={formData.phone}
                    onChange={e => setFormData((p: any) => ({ ...p, phone: e.target.value }))}
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('employee.salary_label')}</label>
                <Input
                    type="number"
                    value={formData.salary}
                    onChange={e => setFormData((p: any) => ({ ...p, salary: e.target.value }))}
                />
            </div>
        </div>

        <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('employee.address_label')}</label>
            <textarea
                value={formData.address}
                onChange={e => setFormData((p: any) => ({ ...p, address: e.target.value }))}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-400"
            />
        </div>

        <div className="flex gap-2 pt-2">
            <Button onClick={() => handleSubmit(mode)} disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {isSaving ? t('employee.save_processing') : mode === 'create' ? t('employee.add_employee') : t('employee.update')}
            </Button>
            <DialogClose asChild>
                <Button variant="outline">{t('employee.cancel')}</Button>
            </DialogClose>
        </div>
    </div>
);

// --- Main Page Component ---
export default function EmployeesIndex({ employees, settings }: { employees: any, settings?: any }) {

    const { globalSettings } = usePage().props as any;
    const currency = globalSettings?.currency || '$';
    const [searchTerm, setSearchTerm] = useState(''); // NEW: Search state
    const [showCreate, setShowCreate] = useState(false);
    const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Filter Logic
    const filteredEmployees = useMemo(() => {
        if (!employees.data) return [];
        return employees.data.filter((emp: Employee) =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees.data, searchTerm]);

    const openCreate = () => {
        setFormData({ ...emptyForm });
        setImagePreview(null);
        setShowCreate(true);
    };

    const openEdit = (emp: Employee) => {
        setFormData({
            name: emp.name,
            position: emp.position || '',
            phone: emp.phone || '',
            address: emp.address || '',
            salary: String(emp.salary),
            image: null
        });
        setImagePreview(emp.image ? `/storage/${emp.image}` : null);
        setEditEmployee(emp);
    };

    const handleViewProfile = (emp: Employee) => {
        setSelectedEmployee(emp);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({ ...prev, image: file }));
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = (mode: 'create' | 'edit') => {
        setIsSaving(true);
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('position', formData.position);
        fd.append('phone', formData.phone);
        fd.append('address', formData.address);
        fd.append('salary', formData.salary);
        if (formData.image) fd.append('image', formData.image);

        const url = mode === 'create' ? '/employees' : `/employees/${editEmployee!.id}`;
        if (mode === 'edit') fd.append('_method', 'PUT');

        axios.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(() => {
                toast.success(mode === 'create' ? t('employee.employee_created') : t('employee.employee_updated'));
                setShowCreate(false);
                setEditEmployee(null);
                router.reload({ only: ['employees'] });
            })
            .catch(() => toast.error('Something went wrong.'))
            .finally(() => setIsSaving(false));
    };

    const confirmDelete = (id: number) => {
        setEmployeeToDelete(id);
    };

    const handleDelete = () => {
        if (!employeeToDelete) return;

        router.delete(`/employees/${employeeToDelete}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('employee.delete_success') || 'Employee deleted!');
                setEmployeeToDelete(null);
            },
            onError: () => {
                toast.error(t('employee.delete_error') || 'Failed to delete employee.');
            }
        });
    };

    const exportData = (format: 'excel' | 'pdf') => {
        const queryParams = new URLSearchParams();
        queryParams.append('format', format);
        window.location.href = `/employees/export?${queryParams.toString()}`;
    };


    return (
        <>
            <Head title="Employees" />
            <div className="p-6 space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('employee.employee_title')}</h1>
                        <p className="text-sm text-gray-500 mt-1">{t('employee.employee_description')}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Box */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder={t('employee.search_placeholder')}
                                className="pl-10 bg-white border-gray-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 whitespace-nowrap">
                            + {t('employee.add_employee')}
                        </Button>
                        <Button variant="outline" onClick={() => exportData('excel')}>
                            📄 {t('employee.export')} Excel
                        </Button>
                    </div>
                </div>

                {/* Employee Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredEmployees.length > 0 ? filteredEmployees.map((emp: Employee) => (
                        <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <div className="bg-gradient-to-br from-slate-50 to-indigo-50 p-6 flex flex-col items-center gap-3 relative">
                                <button
                                    onClick={() => handleViewProfile(emp)}
                                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Eye size={16} />
                                </button>

                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
                                    {emp.image
                                        ? <img src={`/storage/${emp.image}`} className="w-full h-full object-cover" alt={emp.name} />
                                        : <User size={32} className="text-gray-400" />
                                    }
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-gray-900 text-base">{emp.name}</p>
                                    <Badge className="mt-1 bg-white text-indigo-600 border-indigo-100 text-[10px] uppercase font-bold tracking-tighter">{emp.position || t('employee.staff_member')}</Badge>
                                </div>
                            </div>

                            <div className="p-4 space-y-2 text-xs text-gray-600">
                                <p className="flex items-center gap-2"><Phone size={14} className="text-slate-300" /> {emp.phone || 'No phone'}</p>
                                <p className="flex items-start gap-2"><MapPin size={14} className="text-slate-300" /> <span className="truncate">{emp.address || 'No address'}</span></p>
                                <p className="flex items-center gap-2 font-bold text-indigo-600"><Wallet size={14} /> {settings['currency_symbol']}{Number(emp.salary).toLocaleString()}/{t('employee.month')}</p>
                            </div>

                            <div className="border-t px-4 py-3 flex gap-2 bg-slate-50/50">
                                <Button variant="ghost" size="sm" className="flex-1 text-xs hover:bg-white" onClick={() => openEdit(emp)}><Pencil size={14} className="mr-1" /> {t('employee.edit')}</Button>
                                <Button variant="ghost" size="sm" className="flex-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => confirmDelete(emp.id)}><Trash2 size={14} className="mr-1" /> {t('employee.delete')}</Button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={32} className="text-slate-300" />
                            </div>
                            <p className="text-gray-500 font-medium">{t('employee.no_employees')}</p>
                        </div>
                    )}
                </div>

                {/* Pagination (Simplified) */}
                {employees.links?.length > 3 && searchTerm === '' && (
                    <div className="flex items-center justify-center gap-1 mt-8">
                        {employees.links.map((link: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => link.url && router.get(link.url)}
                                disabled={!link.url || link.active}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-4 py-2 text-xs rounded-lg border transition-all ${link.active
                                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                    : !link.url ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-slate-50'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* --- MODALS (Create, Edit, Profile View) --- */}
            {/* [Keep your existing Dialog code here - same as previous response] */}

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-md rounded-3xl">
                    <h2 className="text-xl font-black mb-4">{t('employee.new_employee')}</h2>
                    <EmployeeForm
                        mode="create"
                        formData={formData}
                        setFormData={setFormData}
                        imagePreview={imagePreview}
                        handleImageChange={handleImageChange}
                        handleSubmit={handleSubmit}
                        isSaving={isSaving}
                        currency={currency}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
                <DialogContent className="max-w-md rounded-3xl">
                    <h2 className="text-xl font-black mb-4">{t('employee.edit_employee')}</h2>
                    {editEmployee && (
                        <EmployeeForm
                            mode="edit"
                            formData={formData}
                            setFormData={setFormData}
                            imagePreview={imagePreview}
                            handleImageChange={handleImageChange}
                            handleSubmit={handleSubmit}
                            isSaving={isSaving}
                            currency={currency}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl border-none shadow-2xl">
                    <div id="employee-profile-print" className="p-10 bg-white text-slate-900">
                        {/* Header */}
                        <div className="mb-8 flex justify-between items-end border-b-4 border-slate-900 pb-5">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    {settings?.company_name || "EMPLOYEE RECORD"}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">
                                    Official Personnel Identification Card
                                </p>
                            </div>
                            <div className="text-right text-[10px] font-mono text-slate-400">
                                REC_NUM: #00{selectedEmployee?.id}
                            </div>
                        </div>

                        {/* Excel Style Grid */}
                        <div className="border-2 border-slate-900 overflow-hidden">
                            <table className="w-full text-sm border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-900">
                                        <td rowSpan="3" className="w-40 border-r border-slate-900 p-3 bg-slate-50 text-center">
                                            <div className="w-32 h-40 bg-white border border-slate-300 mx-auto flex items-center justify-center overflow-hidden rounded shadow-inner">
                                                {selectedEmployee?.image ? (
                                                    <img src={`/storage/${selectedEmployee.image}`} className="w-full h-full object-cover" alt="Profile" />
                                                ) : (
                                                    <User size={48} className="text-slate-200" />
                                                )}
                                            </div>
                                        </td>
                                        <td colSpan="2" className="p-4 font-black text-xl text-slate-900 italic">
                                            {selectedEmployee?.name}
                                            <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{selectedEmployee?.position || t('employee.staff_member')}</div>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-300">
                                        {/* <td className="p-4 bg-slate-100 font-bold border-r border-slate-300 uppercase text-[10px] text-slate-500">Contact Number</td> */}
                                        <td colSpan="2" className="p-4 font-mono font-bold tracking-widest text-base">{selectedEmployee?.phone || "N/A"}</td>
                                    </tr>
                                    <tr className="border-b border-slate-900">
                                        {/* <td className="p-4 bg-slate-100 font-bold border-r border-slate-300 uppercase text-[10px] text-slate-500">Residential Address</td> */}
                                        <td colSpan="2" className="p-4 text-slate-700 text-xs leading-relaxed">
                                            {selectedEmployee?.address || "No primary address registered."}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 bg-slate-100 font-bold border-r border-slate-300 text-center uppercase text-[10px] text-slate-500">Verification</td>
                                        <td colSpan="3" className="p-4 bg-slate-50 text-[10px] font-bold text-slate-400 italic">
                                            System timestamp: {new Date().toLocaleString('en-GB')} | Verified by Internal HR
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            <span>Confidential Record</span>
                            <span className="border-b border-slate-300 pb-1 w-48 text-right">Signature</span>
                        </div>
                    </div>

                    <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100 print:hidden">
                        <Button
                            onClick={() => window.print()}
                            className="flex-1 bg-slate-900 text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
                        >
                            <Printer size={18} /> PRINT DOCUMENT
                        </Button>
                        <Button
                            onClick={() => setSelectedEmployee(null)}
                            variant="outline"
                            className="px-8 py-6 rounded-xl font-bold"
                        >
                            CLOSE
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={employeeToDelete !== null} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('employee.delete_title') || 'Are you sure?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('employee.delete_description') || 'This action cannot be undone. This will permanently delete the employee.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('employee.cancel') || 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                            {t('employee.delete') || 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}