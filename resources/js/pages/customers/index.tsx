import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { route } from 'ziggy-js';
import { PrinterIcon, FileSpreadsheetIcon } from 'lucide-react';
import axios from 'axios';

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
    parentCustomers: any[];
    filters: { search?: string };
}

const EMPTY_FORM = {
    parent_id: '',
    name: '',
    phone: '',
    address: '',
    other_info: '',
    status: '',
};

const getEmptyForm = () => ({
    parent_id: '',
    name: '',
    phone: '',
    address: '',
    other_info: '',
    start_date: '',
    status: '',
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function Index({ customers, parentCustomers, filters }: Props) {

    const { t } = useTranslation();

    const [search, setSearch] = useState(filters?.search || '');
    const [form, setForm] = useState(getEmptyForm());


    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Delete state
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // View state
    const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    // Statement state
    const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
    const [isStatementOpen, setIsStatementOpen] = useState(false);
    const [statementData, setStatementData] = useState<any[]>([]);
    const [isFetchingStatement, setIsFetchingStatement] = useState(false);

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

    const openViewModal = (customer: Customer) => {
        setViewingCustomer(customer);
        setIsViewOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setForm({
            parent_id: customer.parent_id != null ? String(customer.parent_id) : '',
            name: customer.name ?? '',
            phone: String(customer.phone ?? ''),
            address: (customer as any).address ?? '',
            other_info: customer.other_info != null ? String(customer.other_info) : '',
            start_date: customer.start_date ?? '',
            status: customer.status,
        });
        setIsOpen(true);
    };

    const openStatementModal = (customer: Customer) => {
        setStatementCustomer(customer);
        setIsStatementOpen(true);
        setIsFetchingStatement(true);
        axios.get(`/customers/${customer.id}/statement`)
            .then(res => {
                setStatementData(res.data.orders);
            })
            .catch(err => {
                toast.error('Failed to load statement data.');
            })
            .finally(() => {
                setIsFetchingStatement(false);
            });
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();
        if (form.parent_id && form.parent_id !== 'none') fd.append('parent_id', form.parent_id);
        fd.append('name', form.name);
        fd.append('phone', form.phone);
        fd.append('address', form.address);
        fd.append('other_info', form.other_info);
        if (form.start_date) fd.append('start_date', form.start_date);
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

    const handlePrint = () => {
        const printContent = document.getElementById('printable-customer-info');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Print</title>
                        <style>
                            body { font-family: sans-serif; padding: 40px; color: #111827; }
                            .grid { display: grid; }
                            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                            .col-span-2 { grid-column: span 2 / span 2; }
                            .gap-2 { gap: 0.5rem; }
                            .border-b { border-bottom-width: 1px; border-bottom-style: solid; border-color: #e5e7eb; }
                            .pb-2 { padding-bottom: 0.5rem; }
                            .font-semibold { font-weight: 600; }
                            .text-gray-600 { color: #4b5563; }
                            .capitalize { text-transform: capitalize; }
                            .mb-2 { margin-bottom: 0.5rem; }
                            .mt-4 { margin-top: 1rem; }
                            .list-disc { list-style-type: disc; }
                            .list-inside { list-style-position: inside; }
                            .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
                            .ml-2 { margin-left: 0.5rem; }
                            @media print {
                                body { padding: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">ព័ត៌មានលម្អិត</h2>
                        ${printContent.innerHTML}
                        <script>
                            window.onload = () => {
                                setTimeout(() => {
                                    window.print();
                                    window.close();
                                }, 250);
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow?.document.close();
        }
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

    const columns = buildColumns(openViewModal, openEditModal, handleDelete, openStatementModal);

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

                            {/* Parent Customer */}
                            <div className="space-y-1">
                                <Label>{t('depot.depot_parent_label')}</Label>
                                <Select value={form.parent_id} onValueChange={v => setForm(f => ({ ...f, parent_id: v }))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('depot.depot_parent_select')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{t('depot.depot_parent_select')}</SelectItem>
                                        {parentCustomers.filter(pc => pc.id !== editingCustomer?.id).map((pc: any) => (
                                            <SelectItem key={pc.id} value={String(pc.id)}>
                                                {pc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.parent_id && <p className="text-red-500 text-xs">{errors.parent_id}</p>}
                            </div>

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

                            {/* Start Date */}
                            <div className="space-y-1">
                                <Label htmlFor="start_date">{t('depot.start_date', { defaultValue: 'Start Date' })}</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={form.start_date}
                                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                                />
                                {errors.start_date && <p className="text-red-500 text-xs">{errors.start_date}</p>}
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

            {/* ── View Dialog ────────────────────────────────────────────── */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ព័ត៌មានលម្អិត</DialogTitle>
                    </DialogHeader>
                    {viewingCustomer && (
                        <div id="printable-customer-info" className="space-y-4 text-sm mt-4">
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="font-semibold text-gray-600">ឈ្មោះ:</span>
                                <span className="col-span-2">{viewingCustomer.name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="font-semibold text-gray-600">ទូរស័ព្ទ:</span>
                                <span className="col-span-2">{viewingCustomer.phone}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="font-semibold text-gray-600">អាស័យដ្ឋាន:</span>
                                <span className="col-span-2">{viewingCustomer.address || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="font-semibold text-gray-600">ស្ថានភាព:</span>
                                <span className="col-span-2 capitalize">{viewingCustomer.status}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="font-semibold text-gray-600">{t('depot.start_date', { defaultValue: 'ថ្ងៃចាប់ផ្តើម' })}:</span>
                                <span className="col-span-2">{viewingCustomer.start_date ? new Date(viewingCustomer.start_date).toLocaleDateString('en-GB') : '-'}</span>
                            </div>

                            {viewingCustomer.parent && (
                                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                    <span className="font-semibold text-gray-600">ដេប៉ូ:</span>
                                    <span className="col-span-2">{viewingCustomer.parent.name}</span>
                                </div>
                            )}

                            {viewingCustomer.sub_customers && viewingCustomer.sub_customers.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-600 mb-2 mt-4">ដេប៉ូចំណុះ:</h4>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        {viewingCustomer.sub_customers.map(sub => (
                                            <li key={sub.id}>{sub.name} - {sub.phone}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="mt-6 flex sm:justify-between w-full">
                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                            <PrinterIcon className="h-4 w-4" />
                            បោះពុម្ព
                        </Button>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                            ចាកចេញ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Statement Dialog ────────────────────────────────────────────── */}
            <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>របាយការណ៍ការលក់ - {statementCustomer?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4" id="printable-statement">
                        {isFetchingStatement ? (
                            <div className="flex justify-center p-8 text-gray-500">កំពុងផ្ទុកទិន្នន័យ...</div>
                        ) : (
                            <div>
                                <div className="mb-4 text-center">
                                    <h2 className="text-xl font-bold">{statementCustomer?.name} Sales Report</h2>
                                    <p className="text-sm text-gray-500">Including sub-customers</p>
                                </div>
                                <table className="w-full text-sm text-left border-collapse border border-gray-200">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="border border-gray-200 p-2">Date</th>
                                            <th className="border border-gray-200 p-2">Invoice No</th>
                                            <th className="border border-gray-200 p-2">Customer</th>
                                            <th className="border border-gray-200 p-2">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statementData.length > 0 ? (
                                            statementData.map(order => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="border border-gray-200 p-2">{new Date(order.order_date).toLocaleDateString('en-GB')}</td>
                                                    <td className="border border-gray-200 p-2 font-medium">{order.invoice_no}</td>
                                                    <td className="border border-gray-200 p-2">
                                                        {order.customer ? (order.customer.parent ? order.customer.parent.name + ' - ' + order.customer.name : order.customer.name) : 'Walk-in Customer'}
                                                    </td>
                                                    <td className="border border-gray-200 p-2">${Number(order.total_amount).toFixed(2)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="text-center p-6 text-gray-500">No sales found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-6 flex sm:justify-between w-full">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                                const content = document.getElementById('printable-statement');
                                if (content) {
                                    const printWindow = window.open('', '_blank');
                                    printWindow?.document.write(`
                                        <html><head><title>Print Statement</title>
                                        <style>
                                            body { font-family: sans-serif; padding: 20px; color: #111827; }
                                            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                            th { background-color: #f3f4f6; }
                                            .text-center { text-align: center; }
                                            h2 { margin: 0; font-size: 1.5rem; font-weight: bold; }
                                            p { margin: 5px 0 0 0; color: #6b7280; }
                                            .mb-4 { margin-bottom: 1rem; }
                                        </style>
                                        </head><body>${content.innerHTML}
                                        <script>window.onload=()=>setTimeout(()=>{window.print();window.close();},250)</script>
                                        </body></html>
                                    `);
                                    printWindow?.document.close();
                                }
                            }} className="gap-2">
                                <PrinterIcon className="h-4 w-4" />
                                បោះពុម្ព
                            </Button>
                            <Button variant="outline" onClick={() => {
                                if (!statementData.length) return;
                                const headers = ['Date', 'Invoice No', 'Customer', 'Total Amount'];
                                const csvRows = [headers.join(',')];
                                statementData.forEach(order => {
                                    const date = new Date(order.order_date).toLocaleDateString('en-GB');
                                    const invoice = order.invoice_no;
                                    const cName = order.customer ? (order.customer.parent ? order.customer.parent.name + ' - ' + order.customer.name : order.customer.name) : 'Walk-in Customer';
                                    const customerName = '"' + cName.replace(/"/g, '""') + '"';
                                    const total = order.total_amount;
                                    csvRows.push([date, invoice, customerName, total].join(','));
                                });
                                const csvString = csvRows.join('\\n');
                                const blob = new Blob(['\\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'statement_' + (statementCustomer?.name || 'customer') + '.csv';
                                a.click();
                            }} className="gap-2 text-green-700 hover:text-green-800 hover:bg-green-50">
                                <FileSpreadsheetIcon className="h-4 w-4" />
                                Export Excel
                            </Button>
                        </div>
                        <Button variant="outline" onClick={() => setIsStatementOpen(false)}>
                            ចាកចេញ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: ('depot.depot_label'), href: '/customers' },
    ],
};
