import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { route } from 'ziggy-js';
import { PrinterIcon, FileSpreadsheetIcon, CalendarIcon, DollarSignIcon } from 'lucide-react';
import axios from 'axios';

import { buildColumns, Customer, Settings } from "./columns";
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
    settings: Settings;
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
    rent_due_date: '',
    rent_amount: '',
});


export default function Index({ customers, settings, parentCustomers, filters }: Props) {

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

    // Pay Rent state
    const [payRentCustomer, setPayRentCustomer] = useState<Customer | null>(null);
    const [isPayRentOpen, setIsPayRentOpen] = useState(false);
    const [paymentDate, setPaymentDate] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [nextDueDate, setNextDueDate] = useState('');
    const [isPayingRent, setIsPayingRent] = useState(false);

    // Form state (managed manually — not useForm — because image is a File)
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const resetForm = () => {
        setForm(getEmptyForm());
    };

    const formatCurrency = (amount: number | string | null | undefined, currencySymbol: string = '$'): string => {
        if (!amount) return `${currencySymbol}0`;
        const numAmount = Number(amount);
        if (isNaN(numAmount)) return `${currencySymbol}0`;

        const formattedAmount = numAmount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        return `${currencySymbol}${formattedAmount}`;
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
            rent_due_date: (customer as any).rent_due_date ?? '',
            rent_amount: (customer as any).rent_amount != null ? String((customer as any).rent_amount) : '',
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

    // ── Pay Rent Functions ──────────────────────────────────────────────────

    const openPayRentModal = (customer: Customer) => {
        setPayRentCustomer(customer);
        // Set default payment date to today
        const today = new Date().toISOString().split('T')[0];
        setPaymentDate(today);
        // Set payment amount as number string, not formatted
        setPaymentAmount(customer.rent_amount?.toString() || '');
        // Default next due date: 1 month from today
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setNextDueDate(nextMonth.toISOString().split('T')[0]);
        setIsPayRentOpen(true);
    };


    const handlePayRent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!payRentCustomer) return;

        setIsPayingRent(true);

        const data = {
            payment_date: paymentDate,
            payment_amount: paymentAmount,
            next_due_date: nextDueDate,
        };

        axios.post(`/customers/${payRentCustomer.id}/pay-rent`, data)
            .then(response => {
                toast.success('Rent payment recorded successfully!');
                setIsPayRentOpen(false);
                // Refresh the page data
                router.reload({ preserveState: false });
            })
            .catch(error => {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    toast.error('Failed to record rent payment.');
                }
            })
            .finally(() => {
                setIsPayingRent(false);
            });
    };

    const openRentHistory = (customer: Customer) => {
        router.visit(route('customers.rent-history', customer.id));
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const handlePrint = () => {
            const printContent = document.getElementById('printable-customer-info');
            if (printContent) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    const currentDate = new Date().toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Customer Information - ${viewingCustomer?.name}</title>
                        <style>
                            /* Reset and base styles */
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            
                            body {
                                font-family: 'Khmer OS', 'Noto Sans Khmer', 'Arial', sans-serif;
                                padding: 40px;
                                color: #111827;
                                background: #ffffff;
                                line-height: 1.6;
                            }
                            
                            /* Header */
                            .print-header {
                                text-align: center;
                                border-bottom: 3px solid #e5e7eb;
                                padding-bottom: 20px;
                                margin-bottom: 30px;
                            }
                            
                            .print-header h1 {
                                font-size: 24px;
                                font-weight: bold;
                                color: #1f2937;
                                margin-bottom: 5px;
                            }
                            
                            .print-header .subtitle {
                                color: #6b7280;
                                font-size: 14px;
                            }
                            
                            .print-header .date {
                                color: #9ca3af;
                                font-size: 12px;
                                margin-top: 5px;
                            }
                            
                            /* Customer Info Grid */
                            .info-grid {
                                display: grid;
                                grid-template-columns: 150px 1fr;
                                gap: 12px 20px;
                                margin-bottom: 20px;
                            }
                            
                            .info-item {
                                display: contents;
                            }
                            
                            .info-label {
                                font-weight: 600;
                                color: #4b5563;
                                padding: 8px 0;
                                border-bottom: 1px solid #f3f4f6;
                            }
                            
                            .info-value {
                                padding: 8px 0;
                                border-bottom: 1px solid #f3f4f6;
                                color: #1f2937;
                            }
                            
                            /* Rent Summary Section */
                            .rent-summary {
                                margin-top: 25px;
                                padding: 20px;
                                background: #f8fafc;
                                border-radius: 8px;
                                border: 1px solid #e5e7eb;
                            }
                            
                            .rent-summary h3 {
                                font-size: 16px;
                                font-weight: 600;
                                color: #1e293b;
                                margin-bottom: 15px;
                            }
                            
                            .rent-grid {
                                display: grid;
                                grid-template-columns: repeat(3, 1fr);
                                gap: 15px;
                            }
                            
                            .rent-item {
                                text-align: center;
                                padding: 10px;
                                background: white;
                                border-radius: 6px;
                                border: 1px solid #e5e7eb;
                            }
                            
                            .rent-item .label {
                                font-size: 11px;
                                color: #6b7280;
                                display: block;
                                margin-bottom: 4px;
                            }
                            
                            .rent-item .value {
                                font-size: 16px;
                                font-weight: bold;
                                color: #1f2937;
                            }
                            
                            /* Sub Customers */
                            .sub-customers {
                                margin-top: 20px;
                            }
                            
                            .sub-customers h3 {
                                font-size: 16px;
                                font-weight: 600;
                                color: #1e293b;
                                margin-bottom: 10px;
                            }
                            
                            .sub-customers ul {
                                list-style: none;
                                padding: 0;
                            }
                            
                            .sub-customers li {
                                padding: 8px 12px;
                                background: #f9fafb;
                                margin-bottom: 4px;
                                border-radius: 4px;
                                border-left: 3px solid #6366f1;
                            }
                            
                            /* Footer */
                            .print-footer {
                                margin-top: 40px;
                                padding-top: 20px;
                                border-top: 2px solid #e5e7eb;
                                text-align: center;
                                color: #9ca3af;
                                font-size: 12px;
                            }
                            
                            /* Print-specific styles */
                            @media print {
                                body {
                                    padding: 20px;
                                }
                                
                                .no-print {
                                    display: none !important;
                                }
                                
                                .rent-summary {
                                    break-inside: avoid;
                                }
                                
                                .sub-customers {
                                    break-inside: avoid;
                                }
                            }
                            
                            /* Responsive */
                            @media (max-width: 600px) {
                                .rent-grid {
                                    grid-template-columns: 1fr;
                                }
                                
                                .info-grid {
                                    grid-template-columns: 1fr;
                                    gap: 4px;
                                }
                                
                                .info-label {
                                    border-bottom: none;
                                    padding-bottom: 0;
                                }
                                
                                .info-value {
                                    padding-top: 0;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <!-- Header -->
                        <div class="print-header">
                            <h1>ព័ត៌មានលម្អិតអតិថិជន</h1>
                            <div class="subtitle">Customer Information</div>
                            <div class="date">បោះពុម្ពថ្ងៃទី: ${currentDate}</div>
                        </div>
                        
                        <!-- Customer Information -->
                        <div class="info-grid">
                            <div class="info-label">ឈ្មោះ / Name:</div>
                            <div class="info-value">${viewingCustomer?.name || '-'}</div>
                            
                            <div class="info-label">ទូរស័ព្ទ / Phone:</div>
                            <div class="info-value">${viewingCustomer?.phone || '-'}</div>
                            
                            <div class="info-label">អាស័យដ្ឋាន / Address:</div>
                            <div class="info-value">${viewingCustomer?.address || '-'}</div>
                            
                            <div class="info-label">ព័ត៌មានផ្សេងៗ / Other Info:</div>
                            <div class="info-value">${viewingCustomer?.other_info || '-'}</div>
                            
                            <div class="info-label">ស្ថានភាព / Status:</div>
                            <div class="info-value">${viewingCustomer?.status === 'active' ? 'សកម្ម / Active' : 'អសកម្ម / Inactive'}</div>
                            
                            <div class="info-label">ថ្ងៃចាប់ផ្តើម / Start Date:</div>
                            <div class="info-value">${viewingCustomer?.start_date ? new Date(viewingCustomer.start_date).toLocaleDateString('en-GB') : '-'}</div>
                            
                            ${(viewingCustomer as any)?.rent_amount && Number((viewingCustomer as any).rent_amount) > 0 ? `
                                <div class="info-label">ថ្លៃជួល / Rent Amount:</div>
                                <div class="info-value">${formatCurrency((viewingCustomer as any).rent_amount, settings.currency_symbol)}</div>
                                
                                <div class="info-label">ថ្ងៃកំណត់បង់ / Due Date:</div>
                                <div class="info-value">${(viewingCustomer as any).rent_due_date ? new Date((viewingCustomer as any).rent_due_date).toLocaleDateString('en-GB') : '-'}</div>
                                
                                <div class="info-label">ថ្ងៃបង់ចុងក្រោយ / Last Paid:</div>
                                <div class="info-value">${(viewingCustomer as any).last_paid_date ? new Date((viewingCustomer as any).last_paid_date).toLocaleDateString('en-GB') : '-'}</div>
                            ` : ''}
                            
                            ${viewingCustomer?.parent ? `
                                <div class="info-label">ដេប៉ូមេ / Parent Depot:</div>
                                <div class="info-value">${viewingCustomer.parent.name}</div>
                            ` : ''}
                        </div>
                        
                        <!-- Rent Payment Summary -->
                        ${(viewingCustomer as any)?.rent_amount && Number((viewingCustomer as any).rent_amount) > 0 ? `
                            <div class="rent-summary">
                                <h3>ប្រវត្តិការបង់ថ្លៃជួល / Rent Payment History</h3>
                                <div class="rent-grid">
                                    <div class="rent-item">
                                        <span class="label">បង់សរុប / Total Paid</span>
                                        <span class="value">${formatCurrency(
                        (viewingCustomer as any).rentPayments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0,
                        settings.currency_symbol
                    )}</span>
                                    </div>
                                    <div class="rent-item">
                                        <span class="label">ការបង់ចុងក្រោយ / Last Payment</span>
                                        <span class="value">${(viewingCustomer as any).rentPayments?.[0]?.payment_date
                                ? new Date((viewingCustomer as any).rentPayments[0].payment_date).toLocaleDateString('en-GB')
                                : 'គ្មានការបង់ប្រាក់ / No payments'}</span>
                                    </div>
                                    <div class="rent-item">
                                        <span class="label">ចំនួនដង / Payments</span>
                                        <span class="value">${(viewingCustomer as any).rentPayments?.length || 0} ដង / times</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Sub Customers -->
                        ${viewingCustomer?.sub_customers && viewingCustomer.sub_customers.length > 0 ? `
                            <div class="sub-customers">
                                <h3>ដេប៉ូចំណុះ / Sub Depots (${viewingCustomer.sub_customers.length})</h3>
                                <ul>
                                    ${viewingCustomer.sub_customers.map(sub => `
                                        <li>${sub.name} - ${sub.phone}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <!-- Footer -->
                        <div class="print-footer">
                            <p>បោះពុម្ពដោយ / Printed by: ${document.querySelector('meta[name="user-name"]')?.getAttribute('content') || 'System'}</p>
                            <p>© ${new Date().getFullYear()} - Ice Cream POS System</p>
                        </div>
                        
                        <script>
                            window.onload = function() {
                                setTimeout(function() {
                                    window.print();
                                    window.close();
                                }, 500);
                            };
                        </script>
                    </body>
                </html>
            `);
                    printWindow.document.close();
                }
            }
        };

        const fd = new FormData();
        if (form.parent_id && form.parent_id !== 'none') fd.append('parent_id', form.parent_id);
        fd.append('name', form.name);
        fd.append('phone', form.phone);
        fd.append('address', form.address);
        fd.append('other_info', form.other_info);
        if (form.start_date) fd.append('start_date', form.start_date);
        if (form.rent_due_date) fd.append('rent_due_date', form.rent_due_date);
        if (form.rent_amount) fd.append('rent_amount', form.rent_amount);
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
        // Get the content from the View Dialog
        const printContent = document.getElementById('printable-customer-info');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const currentDate = new Date().toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Get user info from meta tags
                const userName = document.querySelector('meta[name="user-name"]')?.getAttribute('content') || 'System';
                const appName = document.querySelector('meta[name="app-name"]')?.getAttribute('content') || 'Ice Cream POS';
                const appYear = document.querySelector('meta[name="app-year"]')?.getAttribute('content') || new Date().getFullYear().toString();

                printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Customer Information - ${viewingCustomer?.name}</title>
                        <style>
                            /* Reset and base styles */
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            
                            body {
                                font-family: 'Khmer OS', 'Noto Sans Khmer', 'Arial', sans-serif;
                                padding: 40px;
                                color: #111827;
                                background: #ffffff;
                                line-height: 1.6;
                            }
                            
                            /* Header */
                            .print-header {
                                text-align: center;
                                border-bottom: 3px solid #e5e7eb;
                                padding-bottom: 20px;
                                margin-bottom: 30px;
                            }
                            
                            .print-header h1 {
                                font-size: 24px;
                                font-weight: bold;
                                color: #1f2937;
                                margin-bottom: 5px;
                            }
                            
                            .print-header .subtitle {
                                color: #6b7280;
                                font-size: 14px;
                            }
                            
                            .print-header .date {
                                color: #9ca3af;
                                font-size: 12px;
                                margin-top: 5px;
                            }
                            
                            /* Customer Info Grid */
                            .info-grid {
                                display: grid;
                                grid-template-columns: 150px 1fr;
                                gap: 12px 20px;
                                margin-bottom: 20px;
                            }
                            
                            .info-label {
                                font-weight: 600;
                                color: #4b5563;
                                padding: 8px 0;
                                border-bottom: 1px solid #f3f4f6;
                            }
                            
                            .info-value {
                                padding: 8px 0;
                                border-bottom: 1px solid #f3f4f6;
                                color: #1f2937;
                            }
                            
                            /* Rent Summary Section */
                            .rent-summary {
                                margin-top: 25px;
                                padding: 20px;
                                background: #f8fafc;
                                border-radius: 8px;
                                border: 1px solid #e5e7eb;
                            }
                            
                            .rent-summary h3 {
                                font-size: 16px;
                                font-weight: 600;
                                color: #1e293b;
                                margin-bottom: 15px;
                            }
                            
                            .rent-grid {
                                display: grid;
                                grid-template-columns: repeat(3, 1fr);
                                gap: 15px;
                            }
                            
                            .rent-item {
                                text-align: center;
                                padding: 10px;
                                background: white;
                                border-radius: 6px;
                                border: 1px solid #e5e7eb;
                            }
                            
                            .rent-item .label {
                                font-size: 11px;
                                color: #6b7280;
                                display: block;
                                margin-bottom: 4px;
                            }
                            
                            .rent-item .value {
                                font-size: 16px;
                                font-weight: bold;
                                color: #1f2937;
                            }
                            
                            /* Sub Customers */
                            .sub-customers {
                                margin-top: 20px;
                            }
                            
                            .sub-customers h3 {
                                font-size: 16px;
                                font-weight: 600;
                                color: #1e293b;
                                margin-bottom: 10px;
                            }
                            
                            .sub-customers ul {
                                list-style: none;
                                padding: 0;
                            }
                            
                            .sub-customers li {
                                padding: 8px 12px;
                                background: #f9fafb;
                                margin-bottom: 4px;
                                border-radius: 4px;
                                border-left: 3px solid #6366f1;
                            }
                            
                            /* Footer */
                            .print-footer {
                                margin-top: 40px;
                                padding-top: 20px;
                                border-top: 2px solid #e5e7eb;
                                text-align: center;
                                color: #9ca3af;
                                font-size: 12px;
                            }
                            
                            .print-footer .footer-line {
                                margin-top: 5px;
                            }
                            
                            /* Print-specific styles */
                            @media print {
                                body {
                                    padding: 20px;
                                }
                                
                                .no-print {
                                    display: none !important;
                                }
                                
                                .rent-summary {
                                    break-inside: avoid;
                                }
                                
                                .sub-customers {
                                    break-inside: avoid;
                                }
                            }
                            
                            /* Responsive */
                            @media (max-width: 600px) {
                                .rent-grid {
                                    grid-template-columns: 1fr;
                                }
                                
                                .info-grid {
                                    grid-template-columns: 1fr;
                                    gap: 4px;
                                }
                                
                                .info-label {
                                    border-bottom: none;
                                    padding-bottom: 0;
                                }
                                
                                .info-value {
                                    padding-top: 0;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <!-- Header -->
                        <div class="print-header">
                            <h1>ព័ត៌មានលម្អិតអតិថិជន</h1>
                            <div class="subtitle">Customer Information</div>
                            <div class="date">បោះពុម្ពថ្ងៃទី: ${currentDate}</div>
                        </div>
                        
                        <!-- Customer Information -->
                        <div class="info-grid">
                            <div class="info-label">ឈ្មោះៈ</div>
                            <div class="info-value">${viewingCustomer?.name || '-'}</div>
                            
                            <div class="info-label">ទូរស័ព្ទ៖</div>
                            <div class="info-value">${viewingCustomer?.phone || '-'}</div>
                            
                            <div class="info-label">អាស័យដ្ឋាន៖</div>
                            <div class="info-value">${viewingCustomer?.address || '-'}</div>
                            
                            <div class="info-label">ព័ត៌មានផ្សេងៗ៖</div>
                            <div class="info-value">${viewingCustomer?.other_info || '-'}</div>
                            
                            <div class="info-label">ស្ថានភាព៖</div>
                            <div class="info-value">${viewingCustomer?.status === 'active' ? 'សកម្ម / Active' : 'អសកម្ម / Inactive'}</div>
                            
                            <div class="info-label">ថ្ងៃចាប់ផ្តើម៖</div>
                            <div class="info-value">${viewingCustomer?.start_date ? new Date(viewingCustomer.start_date).toLocaleDateString('en-GB') : '-'}</div>
                            
                            ${(viewingCustomer as any)?.rent_amount && Number((viewingCustomer as any).rent_amount) > 0 ? `
                                <div class="info-label">ថ្លៃជួល៖</div>
                                <div class="info-value">${formatCurrency((viewingCustomer as any).rent_amount, settings.currency_symbol)}</div>
                                
                                <div class="info-label">ថ្ងៃកំណត់បង់៖</div>
                                <div class="info-value">${(viewingCustomer as any).rent_due_date ? new Date((viewingCustomer as any).rent_due_date).toLocaleDateString('en-GB') : '-'}</div>
                                
                                <div class="info-label">ថ្ងៃបង់ចុងក្រោយ៖</div>
                                <div class="info-value">${(viewingCustomer as any).last_paid_date ? new Date((viewingCustomer as any).last_paid_date).toLocaleDateString('en-GB') : '-'}</div>
                            ` : ''}
                            
                            ${viewingCustomer?.parent ? `
                                <div class="info-label">ដេប៉ូមេ៖</div>
                                <div class="info-value">${viewingCustomer.parent.name}</div>
                            ` : ''}
                        </div>
                        
                        <!-- Rent Payment Summary -->
                        ${(viewingCustomer as any)?.rent_amount && Number((viewingCustomer as any).rent_amount) > 0 ? `
                            <div class="rent-summary">
                                <h3>ប្រវត្តិការបង់ថ្លៃជួល</h3>
                                <div class="rent-grid">
                                    <div class="rent-item">
                                        <span class="label">បង់សរុប</span>
                                        <span class="value">${formatCurrency(
                    (viewingCustomer as any).rentPayments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0,
                    settings.currency_symbol
                )}</span>
                                    </div>
                                    <div class="rent-item">
                                        <span class="label">ការបង់ចុងក្រោយ</span>
                                        <span class="value">${(viewingCustomer as any).rentPayments?.[0]?.payment_date
                            ? new Date((viewingCustomer as any).rentPayments[0].payment_date).toLocaleDateString('en-GB')
                            : 'គ្មានការបង់ប្រាក់'}</span>
                                    </div>
                                    <div class="rent-item">
                                        <span class="label">ចំនួនដង</span>
                                        <span class="value">${(viewingCustomer as any).rentPayments?.length || 0} ដង / times</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Sub Customers -->
                        ${viewingCustomer?.sub_customers && viewingCustomer.sub_customers.length > 0 ? `
                            <div class="sub-customers">
                                <h3>ដេប៉ូចំណុះ (${viewingCustomer.sub_customers.length})</h3>
                                <ul>
                                    ${viewingCustomer.sub_customers.map(sub => `
                                        <li>${sub.name} - ${sub.phone}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <!-- Footer -->
                        <div class="print-footer">
                            <div>បោះពុម្ពដោយ: ${userName}</div>
                            <div class="footer-line">${appName} - © ${appYear}</div>
                        </div>
                        
                        <script>
                            window.onload = function() {
                                setTimeout(function() {
                                    window.print();
                                    window.close();
                                }, 500);
                            };
                        </script>
                    </body>
                </html>
            `);
                printWindow.document.close();
            }
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

    const columns = buildColumns(
        openViewModal,
        openEditModal,
        handleDelete,
        openStatementModal,
        openPayRentModal,
        openRentHistory,
        settings
    );

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
                        placeholder={t('depot.search_placeholder')}
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

            {/* ── View Dialog ────────────────────────────────────────────── */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ព័ត៌មានលម្អិត</DialogTitle>
                    </DialogHeader>
                    {viewingCustomer && (
                        <div id="printable-customer-info" className="space-y-4 text-sm mt-4">
                            {/* Customer Information */}
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
                                <span className="font-semibold text-gray-600">ព័ត៌មានផ្សេងៗ:</span>
                                <span className="col-span-2">{viewingCustomer.other_info || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="font-semibold text-gray-600">ស្ថានភាព:</span>
                                <span className="col-span-2 capitalize">{viewingCustomer.status}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="font-semibold text-gray-600">{t('depot.start_date', { defaultValue: 'ថ្ងៃចាប់ផ្តើម' })}:</span>
                                <span className="col-span-2">{viewingCustomer.start_date ? new Date(viewingCustomer.start_date).toLocaleDateString('en-GB') : '-'}</span>
                            </div>

                            {/* Rent Information */}
                            {(viewingCustomer as any).rent_amount && Number((viewingCustomer as any).rent_amount) > 0 && (
                                <>
                                    <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                        <span className="font-semibold text-gray-600">{t('depot.rent_due_date', { defaultValue: 'Rent Due Date' })}:</span>
                                        <span className="col-span-2">{(viewingCustomer as any).rent_due_date ? new Date((viewingCustomer as any).rent_due_date).toLocaleDateString('en-GB') : '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                        <span className="font-semibold text-gray-600">{t('depot.rent_amount', { defaultValue: 'Rent Amount' })}:</span>
                                        <span className="col-span-2">{formatCurrency((viewingCustomer as any).rent_amount, settings.currency_symbol)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                        <span className="font-semibold text-gray-600">ថ្ងៃបង់ចុងក្រោយ:</span>
                                        <span className="col-span-2">{(viewingCustomer as any).last_paid_date ? new Date((viewingCustomer as any).last_paid_date).toLocaleDateString('en-GB') : '-'}</span>
                                    </div>

                                    {/* Rent Payment History Summary with View All Button */}
                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-gray-700">ប្រវត្តិការបង់ថ្លៃជួល</h4>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-800 p-0 h-auto font-semibold"
                                                onClick={() => {
                                                    setIsViewOpen(false);
                                                    openRentHistory(viewingCustomer);
                                                }}
                                            >
                                                មើលទាំងអស់ →
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500">បង់សរុប</p>
                                                <p className="font-bold text-blue-700 text-lg">
                                                    {formatCurrency(
                                                        (viewingCustomer as any).rentPayments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0,
                                                        settings.currency_symbol
                                                    )}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500">ការបង់ចុងក្រោយ</p>
                                                <p className="font-bold text-green-700">
                                                    {(viewingCustomer as any).rentPayments?.[0]?.payment_date
                                                        ? new Date((viewingCustomer as any).rentPayments[0].payment_date).toLocaleDateString('en-GB')
                                                        : 'គ្មានការបង់ប្រាក់'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            ចំនួនដង: {(viewingCustomer as any).rentPayments?.length || 0} ដង
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Parent Info */}
                            {viewingCustomer.parent && (
                                <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                    <span className="font-semibold text-gray-600">ដេប៉ូមេ:</span>
                                    <span className="col-span-2">{viewingCustomer.parent.name}</span>
                                </div>
                            )}

                            {/* Sub Customers */}
                            {viewingCustomer.sub_customers && viewingCustomer.sub_customers.length > 0 && (
                                <div className="border-t pt-4 mt-2">
                                    <h4 className="font-semibold text-gray-600 mb-2">ដេប៉ូចំណុះ:</h4>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        {viewingCustomer.sub_customers.map(sub => (
                                            <li key={sub.id} className="text-gray-700">{sub.name} - {sub.phone}</li>
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

                            {/* Address */}
                            <div className="space-y-1">
                                <Label htmlFor="address">{t('depot.address_label')}</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    type="text"
                                    value={form.address}
                                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                />
                                {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                            </div>

                            {/* Other info */}
                            <div className="space-y-1">
                                <Label htmlFor="other_info">{t('depot.other_info')}</Label>
                                <Input
                                    id="other_info"
                                    name="other_info"
                                    type="text"
                                    value={form.other_info}
                                    onChange={e => setForm(f => ({ ...f, other_info: e.target.value }))}
                                />
                                {errors.other_info && <p className="text-red-500 text-xs">{errors.other_info}</p>}
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

                            {/* Rent Due Date and Amount */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="rent_due_date">{t('depot.rent_due_date', { defaultValue: 'Rent Due Date' })}</Label>
                                    <Input
                                        id="rent_due_date"
                                        type="date"
                                        value={form.rent_due_date}
                                        onChange={e => setForm(f => ({ ...f, rent_due_date: e.target.value }))}
                                    />
                                    {errors.rent_due_date && <p className="text-red-500 text-xs">{errors.rent_due_date}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="rent_amount">{t('depot.rent_amount', { defaultValue: 'Rent Amount' })}</Label>
                                    <Input
                                        id="rent_amount"
                                        type="number"
                                        step="0.01"
                                        value={form.rent_amount}
                                        onChange={e => setForm(f => ({ ...f, rent_amount: e.target.value }))}
                                        placeholder="0.00"
                                    />
                                    {errors.rent_amount && <p className="text-red-500 text-xs">{errors.rent_amount}</p>}
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


            {/* ── Pay Rent Dialog ────────────────────────────────────────────── */}
            <Dialog open={isPayRentOpen} onOpenChange={setIsPayRentOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handlePayRent}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <DollarSignIcon className="h-5 w-5 text-blue-600" />
                                បង់ថ្លៃជួល - {payRentCustomer?.name}
                            </DialogTitle>
                            <DialogDescription>
                                កត់ត្រាការបង់ថ្លៃជួល និងកំណត់ថ្ងៃកំណត់បង់បន្ទាប់
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment_date">ថ្ងៃបង់ប្រាក់</Label>
                                <Input
                                    id="payment_date"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                />
                                {errors.payment_date && (
                                    <p className="text-red-500 text-xs">{errors.payment_date}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment_amount">ចំនួនទឹកប្រាក់</Label>
                                <Input
                                    id="payment_amount"
                                    type="number"
                                    step="10000"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                                {errors.payment_amount && (
                                    <p className="text-red-500 text-xs">{errors.payment_amount}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="next_due_date">ថ្ងៃកំណត់បង់បន្ទាប់</Label>
                                <Input
                                    id="next_due_date"
                                    type="date"
                                    value={nextDueDate}
                                    onChange={(e) => setNextDueDate(e.target.value)}
                                    required
                                />
                                {errors.next_due_date && (
                                    <p className="text-red-500 text-xs">{errors.next_due_date}</p>
                                )}
                            </div>

                            <div className="bg-blue-50 p-3 rounded-md">
                                <p className="text-sm text-blue-800">
                                    <strong>ថ្លៃជួលបច្ចុប្បន្ន:</strong>{' '}
                                    {formatCurrency(payRentCustomer?.rent_amount, settings.currency_symbol)}
                                </p>
                                <p className="text-sm text-blue-800 mt-1">
                                    <strong>ថ្ងៃកំណត់បង់បច្ចុប្បន្ន:</strong>{' '}
                                    {payRentCustomer?.rent_due_date ? new Date(payRentCustomer.rent_due_date).toLocaleDateString('en-GB') : '-'}
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsPayRentOpen(false);
                                    setErrors({});
                                }}
                            >
                                បោះបង់
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPayingRent}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isPayingRent ? 'កំពុងដំណើរការ...' : 'បង់ថ្លៃជួល'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {viewingCustomer && (
                <div id="printable-customer-info" className="space-y-4 text-sm mt-4">
                    {/* ... existing fields ... */}

                    {/* Rent Payment History Summary */}
                    {(viewingCustomer as any).rent_amount && (viewingCustomer as any).rent_amount > 0 && (
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-gray-600">Rent Payment History</h4>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-blue-600"
                                    onClick={() => {
                                        setIsViewOpen(false);
                                        openRentHistory(viewingCustomer);
                                    }}
                                >
                                    View All →
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-xs text-gray-500">Total Paid</p>
                                    <p className="font-semibold">
                                        {settings.currency_symbol}
                                        {viewingCustomer.rentPayments?.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2) || '0.00'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-xs text-gray-500">Last Payment</p>
                                    <p className="font-semibold">
                                        {viewingCustomer.rentPayments?.[0]?.payment_date
                                            ? new Date(viewingCustomer.rentPayments[0].payment_date).toLocaleDateString('en-GB')
                                            : 'No payments'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: ('depot.depot_label'), href: '/customers' },
    ],
};