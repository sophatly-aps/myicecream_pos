import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import axios from 'axios';

interface PurchaseItem {
    id: number;
    supplier_id: number;
    supplier_name?: string;
    name: string;
    price: number;
    unit: string;
    image: string;
}

interface Supplier {
    id: number;
    name: string;
}

// 1. Define what a Cart Item looks like
interface CartItem extends PurchaseItem {
    qty: number;
}

interface Props {
    purchase_items: PurchaseItem[];
    suppliers: Supplier[];
    settings: Record<string, string>;
}

export default function Index({ purchase_items, suppliers, settings }: Props) {
    const { t } = useTranslation();

    const currency = settings['currency_symbol'] || '៛';

    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'aba' | 'wing'>(
        'cash',
    );
    const [paymentStatus, setPaymentStatus] = useState<
        'paid' | 'partial' | 'due'
    >('paid');

    const [taxPercent, setTaxPercent] = useState<number>(0);
    const [transportFee, setTransportFee] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState<
        number | 'all'
    >('all');
    const [paidAmount, setPaidAmount] = useState<number>(0);

    // 2. Initialize the cart state
    const [cart, setCart] = useState<CartItem[]>([]);

    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);

    /* Filter logic */
    const filteredPurchaseItems = purchase_items.filter((purchase_item) => {
        const matchesSearch = purchase_item.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesSupplier =
            selectedSupplierId === 'all' ||
            purchase_item.supplier_id === selectedSupplierId;

        return matchesSearch && matchesSupplier;
    });

    // --- Calculation Logic ---

    // 1. Calculate Base Subtotal from Cart
    const subTotal = cart.reduce(
        (acc, item) => acc + Number(item.price) * item.qty,
        0,
    );

    // 2. Calculate Tax Value
    const taxAmount = (subTotal * taxPercent) / 100;

    // 3. Final Grand Total
    const grandTotal =
        subTotal + taxAmount + Number(transportFee) - Number(discountAmount);

    // 4. Change Amount
    const changeAmount = paidAmount > 0 ? paidAmount - grandTotal : 0;

    useEffect(() => {
        if (paidAmount >= grandTotal && grandTotal > 0) {
            setPaymentStatus('paid');
        } else if (paidAmount > 0 && paidAmount < grandTotal) {
            setPaymentStatus('partial');
        } else {
            setPaymentStatus('due');
        }
    }, [paidAmount, grandTotal]);

    const handleQtyChange = (id: number, value: string) => {
        // 1. If the user clears the input completely, allow it to be an empty string temporarily
        // so they can backspace and type a new number easily
        if (value === '') {
            setCart((prevCart) =>
                prevCart.map((item) =>
                    item.id === id ? { ...item, qty: '' as any } : item,
                ),
            );
            return;
        }

        // 2. Convert what they type into a real integer
        const newQty = parseInt(value, 10);

        // 3. Update the state item if it's a valid positive number
        if (!isNaN(newQty) && newQty >= 0) {
            setCart((prevCart) =>
                prevCart.map((item) =>
                    item.id === id ? { ...item, qty: newQty } : item,
                ),
            );
        }
    };

    // 3. The Logic function
    const addToCart = (purchase_item: PurchaseItem) => {
        setCart((prevCart) => {
            // Check if product already exists in cart
            const existingItem = prevCart.find(
                (item) => item.id === purchase_item.id,
            );

            if (existingItem) {
                // If it exists, map through and increase qty of that specific ID
                return prevCart.map((item) =>
                    item.id === purchase_item.id
                        ? { ...item, qty: item.qty + 1 }
                        : item,
                );
            }

            // If it's new, add it with qty 1
            return [...prevCart, { ...purchase_item, qty: 1 }];
        });
    };

    // Decrease quantity or remove item
    const removeFromCart = (purchase_item_id: number) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(
                (item) => item.id === purchase_item_id,
            );

            if (existingItem && existingItem.qty > 1) {
                // Just decrease the count
                return prevCart.map((item) =>
                    item.id === purchase_item_id
                        ? { ...item, qty: item.qty - 1 }
                        : item,
                );
            }
            // If qty is 1, remove the whole row
            return prevCart.filter((item) => item.id !== purchase_item_id);
        });
    };

    const handleCheckout = () => {
        if (processing) return; // ✅ BLOCK DOUBLE CLICK
        if (cart.length === 0) return;

        setProcessing(true);

        const payload = {
            cart: cart,
            sub_total: subTotal,
            total_amount: grandTotal,
            tax_amount: taxAmount,
            transport_fee: transportFee,
            discount_amount: discountAmount,
            paid_amount: paidAmount,
            change_amount: changeAmount,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
        };

        axios
            .post(route('purchase.store'), payload)
            .then((response) => {
                if (response.data.success) {
                    setLastOrder(response.data.purchase);
                    // setShowInvoiceModal(true);
                    setCart([]); // Clear cart after success
                    setTransportFee(0);
                    setTaxPercent(0);
                    setDiscountAmount(0);
                    setPaymentMethod('cash');
                    setPaymentStatus('paid');
                    setPaidAmount(0);
                    toast.success('ការទិញជោគជ័យ! (Purchase Successful)');
                }
            })
            .catch(() => {
                toast.error('មានបញ្ហាក្នុងការទូទាត់ប្រាក់ (Payment Error)');
            })
            .finally(() => {
                setProcessing(false);
            });
    };

    // Clear the entire order
    const clearCart = () => {
        if (cart.length === 0) return;

        // Optional: Add a quick confirmation
        if (confirm('តើអ្នកពិតជាចង់លុបការបញ្ជាទិញនេះមែនទេ?')) {
            // "Do you really want to delete this order?"
            setCart([]);
            toast.error('Order cleared');
        }
    };

    return (
        <>
            <Head title="Sale POS" />
            <div className="flex h-screen overflow-hidden bg-gray-50">
                {/* --- MAIN SECTION (Left & Center) --- */}
                <div className="flex flex-1 flex-col overflow-hidden p-6">
                    <div className="mb-6 space-y-6">
                        {/* Search and Category Row */}
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            {/* Search Input */}
                            <div className="relative w-full md:w-72">
                                <Input
                                    placeholder={t('purchase.search')}
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-10 font-sans"
                                />
                                <span className="absolute top-2.5 left-3 text-gray-400">
                                    🔍
                                </span>
                            </div>

                            {/* Category Tabs */}
                            <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto">
                                <Button
                                    variant={
                                        selectedSupplierId === 'all'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setSelectedSupplierId('all')}
                                    className="rounded-full px-6"
                                >
                                    All
                                </Button>
                                {suppliers.map((supplier) => (
                                    <Button
                                        key={supplier.id}
                                        variant={
                                            selectedSupplierId === supplier.id
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            setSelectedSupplierId(supplier.id)
                                        }
                                        className="rounded-full px-6 font-sans"
                                    >
                                        {supplier.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Grid for Categories */}
                    <div className="flex-1 overflow-y-auto pr-2 pb-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredPurchaseItems.length > 0 ? (
                                filteredPurchaseItems.map((purchase_item) => (
                                    <Card
                                        onClick={() => addToCart(purchase_item)}
                                        key={purchase_item.id}
                                        className="overflow-hidden transition-shadow hover:shadow-lg"
                                    >
                                        {/* 1. ADD 'relative' HERE */}
                                        <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-indigo-100">
                                            {/* 2. THE BADGE (Now stays inside the relative box) */}
                                            {purchase_item.supplier_name && (
                                                <Badge
                                                    variant="secondary"
                                                    className="absolute top-2 right-2 z-20 bg-indigo-600 font-sans text-white opacity-90 shadow-sm hover:bg-indigo-700"
                                                >
                                                    {
                                                        purchase_item.supplier_name
                                                    }
                                                </Badge>
                                            )}

                                            {/* 3. CLEANED UP IMAGE RENDER */}
                                            <img
                                                src={
                                                    purchase_item.image
                                                        ? `/storage/${purchase_item.image}`
                                                        : '/images/placeholder.png'
                                                }
                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                alt={purchase_item.name}
                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src =
                                                        '/images/placeholder.png';
                                                }}
                                            />
                                        </div>

                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="truncate font-sans text-sm">
                                                    <strong>
                                                        {purchase_item.name}
                                                    </strong>
                                                </p>
                                                <p className="text-sm font-bold whitespace-nowrap text-indigo-700">
                                                    {currency}
                                                    {purchase_item.price}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full rounded-xl border-2 border-dashed bg-gray-50 py-20 text-center">
                                    <p className="text-lg text-gray-500">
                                        {t('purchase.no_purchase_item')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Right Sidebar (Order Summary) --- */}
                <div className="flex h-full w-96 flex-col border-l bg-white p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-sans text-xl font-bold">
                            {t('purchase.current_purchase')}
                        </h2>
                        {cart.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                onClick={clearCart}
                            >
                                {t('purchase.clear_all')}
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="group relative rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-indigo-200"
                            >
                                <div className="mb-2 flex items-start justify-between">
                                    <span className="truncate pr-4 font-sans text-sm font-bold">
                                        {item.name}
                                    </span>
                                    <span className="text-sm font-bold text-indigo-700">
                                        {currency}
                                        {(
                                            Number(item.price) * item.qty
                                        ).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        {currency}
                                        {item.price} / {item.unit}
                                    </span>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-3 rounded-lg border bg-white p-1 shadow-sm">
                                        <button
                                            onClick={() =>
                                                removeFromCart(item.id)
                                            }
                                            className="flex h-6 w-6 items-center justify-center rounded text-red-800 transition-colors hover:bg-red-200"
                                        >
                                            -
                                        </button>

                                        {/* Changed from span to an input type="number" */}
                                        <input
                                            type="number"
                                            value={
                                                item.qty === 0 ? '' : item.qty
                                            } // Prevents zero-glitches when typing
                                            onChange={(e) =>
                                                handleQtyChange(
                                                    item.id,
                                                    e.target.value,
                                                )
                                            }
                                            className="w-12 [appearance:textfield] rounded border p-0.5 text-center text-sm font-bold focus:border-blue-500 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            min="0"
                                            onBlur={(e) => {
                                                if (
                                                    e.target.value === '' ||
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) === 0
                                                ) {
                                                    handleQtyChange(
                                                        item.id,
                                                        '1',
                                                    );
                                                }
                                            }}
                                        />

                                        {/* <span className="min-w-[20px] text-center text-sm font-bold">
                                            {item.qty}
                                        </span> */}
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="flex h-6 w-6 items-center justify-center rounded text-green-800 transition-colors hover:bg-green-200"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ... Total and Checkout Section ... */}
                    <div className="mt-auto space-y-3 border-t px-2 pt-4">
                        {/* Subtotal Display (Static) */}
                        <div className="text-md flex justify-between text-gray-600">
                            <span>{t('purchase.sub_total')}</span>
                            <span>
                                {currency}
                                {subTotal.toFixed(2)}
                            </span>
                        </div>

                        {/* Adjustment Inputs */}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('purchase.tax')}
                                </label>
                                <Input
                                    type="number"
                                    value={taxPercent || ''}
                                    onChange={(e) =>
                                        setTaxPercent(Number(e.target.value))
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('purchase.discount')}
                                </label>
                                <Input
                                    type="number"
                                    value={discountAmount || ''}
                                    onChange={(e) =>
                                        setDiscountAmount(
                                            Number(e.target.value),
                                        )
                                    }
                                    className="h-8 text-sm font-bold text-red-500"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('purchase.transport_fee')}
                                </label>
                                <Input
                                    type="number"
                                    value={transportFee || ''}
                                    onChange={(e) =>
                                        setTransportFee(Number(e.target.value))
                                    }
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 px-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                                {t('purchase.payment_method')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={
                                        paymentMethod === 'cash'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex h-14 flex-col gap-1 ${paymentMethod === 'cash' ? 'bg-green-600' : ''}`}
                                >
                                    <span className="text-lg">💵</span>
                                    <span className="text-[10px]">
                                        {t('purchase.cash')}
                                    </span>
                                </Button>

                                <Button
                                    variant={
                                        paymentMethod === 'aba'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setPaymentMethod('aba')}
                                    className={`flex h-14 flex-col gap-1 ${paymentMethod === 'aba' ? 'bg-blue-600' : ''}`}
                                >
                                    <span className="text-lg">📱</span>
                                    <span className="text-[10px]">
                                        {t('purchase.aba')}
                                    </span>
                                </Button>

                                <Button
                                    variant={
                                        paymentMethod === 'wing'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setPaymentMethod('wing')}
                                    className={`flex h-14 flex-col gap-1 ${paymentMethod === 'wing' ? 'bg-yellow-500' : ''}`}
                                >
                                    <span className="text-lg">💸</span>
                                    <span className="text-[10px]">
                                        {t('purchase.wing')}
                                    </span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 px-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                                {t('purchase.payment_status')}
                            </label>
                            <div className="flex gap-2">
                                {['paid', 'partial', 'due'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() =>
                                            setPaymentStatus(status as any)
                                        }
                                        className={`flex-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                                            paymentStatus === status
                                                ? 'border-slate-800 bg-slate-800 text-white'
                                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {status === 'paid' &&
                                            t('purchase.paid')}
                                        {status === 'partial' &&
                                            t('purchase.partial')}
                                        {status === 'due' && t('purchase.due')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Final Grand Total */}
                        <div className="flex justify-between border-t pt-2 text-xl font-bold text-indigo-800">
                            <span>{t('purchase.grand_total')}</span>
                            <span>
                                {currency}
                                {grandTotal.toFixed(2)}
                            </span>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || processing}
                            className="w-full bg-indigo-700 py-6 text-lg font-bold hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 animate-spin text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    {t('purchase.processing')}
                                </span>
                            ) : (
                                t('purchase.save')
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Invoice Modal */}
            <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
                <DialogContent className="max-w-md overflow-hidden rounded-xl border-none bg-[#f1f5f9] p-0 font-sans shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4">
                        <h2 className="bg-transparent text-sm font-bold text-gray-800">
                            Order Invoice
                        </h2>
                    </div>

                    {lastOrder && (
                        <div className="bg-[#f1f5f9] px-8 pt-2 pb-8">
                            {/* Header / Logo section */}
                            <div className="mb-6 flex items-start justify-between border-b border-gray-300 pb-4">
                                <div>
                                    <h1 className="text-[22px] font-bold tracking-tight text-blue-700 italic shadow-blue-500/50 drop-shadow-sm">
                                        {settings['name']}
                                    </h1>
                                    <p className="mt-1 text-[9px] tracking-widest text-gray-500">
                                        {settings['phone']}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h2 className="font-bold tracking-widest text-gray-800">
                                        INVOICE
                                    </h2>
                                    <p className="mt-1 text-[11px] font-bold text-blue-600">
                                        #{lastOrder.invoice_no}
                                    </p>
                                </div>
                            </div>

                            {/* Customer / Date */}
                            <div className="mb-6 flex items-end justify-between text-sm">
                                <div>
                                    <p className="mb-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                                        CUSTOMER
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800">
                                        {lastOrder.customer?.name ||
                                            'Walk-in Customer'}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        Walk-in Client
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="mb-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                                        DATE
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800">
                                        {new Date(
                                            lastOrder.order_date,
                                        ).toLocaleDateString('en-GB')}
                                    </p>
                                </div>
                            </div>

                            {/* Items Header */}
                            <div className="mb-4 grid grid-cols-12 gap-2 border-b border-gray-200 pb-2 text-[9px] font-bold text-gray-400 uppercase">
                                <div className="col-span-6">
                                    ITEM DESCRIPTION
                                </div>
                                <div className="col-span-2 text-center">
                                    QTY
                                </div>
                                <div className="col-span-2 text-right">
                                    PRICE
                                </div>
                                <div className="col-span-2 text-right">
                                    TOTAL
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="mb-6 min-h-[100px] space-y-4">
                                {lastOrder.details?.map((detail: any) => (
                                    <div
                                        key={detail.id}
                                        className="grid grid-cols-12 gap-2 text-[13px]"
                                    >
                                        <div className="col-span-6 pr-2 font-bold text-gray-800">
                                            {detail.product?.name}
                                        </div>
                                        <div className="col-span-2 text-center text-gray-800">
                                            {detail.quantity}
                                            {detail?.unit}
                                        </div>
                                        <div className="col-span-2 text-right text-gray-800">
                                            {currency}
                                            {Number(detail.price).toFixed(2)}
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-gray-800">
                                            {currency}
                                            {Number(detail.subtotal).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end border-t-2 border-gray-200 pt-4">
                                <div className="w-[60%] space-y-2 text-[13px] text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-bold text-gray-800">
                                            {currency}
                                            {Number(
                                                lastOrder.sub_total || subTotal,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    {Number(lastOrder.tax_amount) > 0 && (
                                        <div className="flex justify-between">
                                            <span>Tax</span>
                                            <span className="font-bold text-gray-800">
                                                +{currency}
                                                {Number(
                                                    lastOrder.tax_amount,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {Number(lastOrder.discount_amount) > 0 && (
                                        <div className="flex justify-between">
                                            <span>Discount</span>
                                            <span className="font-bold text-red-500">
                                                -{currency}
                                                {Number(
                                                    lastOrder.discount_amount,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {Number(lastOrder.transport_fee) > 0 && (
                                        <div className="flex justify-between">
                                            <span>Transport Fee</span>
                                            <span className="font-bold text-gray-800">
                                                +{currency}
                                                {Number(
                                                    lastOrder.transport_fee,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="mt-2 flex justify-between border-t-2 border-gray-800 pt-2">
                                        <span className="text-lg font-bold text-gray-800">
                                            Total
                                        </span>
                                        <span className="text-xl font-bold text-blue-700">
                                            {currency}
                                            {Number(
                                                lastOrder.total_amount,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="mt-6 text-right">
                                <span className="text-[10px] font-bold tracking-widest text-blue-700 uppercase">
                                    {lastOrder.payment_status === 'paid'
                                        ? 'PAID IN FULL'
                                        : `PAID VIA ${lastOrder.payment_status}`}
                                </span>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-12 text-center text-[10px] font-bold text-gray-400 italic">
                                THANK YOU FOR YOUR BUSINESS!
                            </div>
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="flex items-center gap-4 rounded-b-xl border-t border-gray-100 bg-white p-4">
                        <Button
                            className="flex flex-1 items-center justify-center rounded-xl bg-gray-900 py-6 text-sm font-bold tracking-wide text-white shadow-lg hover:bg-gray-800"
                            onClick={() => {
                                if (lastOrder) {
                                    let printFrame = document.getElementById(
                                        'print-receipt-frame',
                                    ) as HTMLIFrameElement;
                                    if (!printFrame) {
                                        printFrame =
                                            document.createElement('iframe');
                                        printFrame.id = 'print-receipt-frame';
                                        printFrame.style.position = 'absolute';
                                        printFrame.style.width = '0px';
                                        printFrame.style.height = '0px';
                                        printFrame.style.border = 'none';
                                        document.body.appendChild(printFrame);
                                    }
                                    printFrame.src = route(
                                        'sales.printHtml',
                                        lastOrder.id,
                                    );
                                }
                            }}
                        >
                            🖨️ Print Receipt
                        </Button>
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                className="px-6 font-bold text-gray-500 hover:bg-gray-100"
                            >
                                Close
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
