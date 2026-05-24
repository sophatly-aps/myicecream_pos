import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
// Import your other sub-components below (we'll define them)
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import axios from 'axios';

interface Product {
    id: number;
    category_id: number;
    name: string;
    selling_price: number;
    image: string;
    status: string;
    base_price: number;
    category_name: string;
    unit: string;
}

interface Category {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
}

// 1. Define what a Cart Item looks like
interface CartItem extends Product {
    qty: number;
}

interface Props {
    categories: Category[];
    products: Product[];
    customers: Customer[];
    settings: Record<string, string>;
}

export default function Index({
    categories,
    products,
    customers,
    settings,
}: Props) {
    const currency = settings['currency_symbol'] || '៛';
    const { t } = useTranslation();

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
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>(
        'all',
    );
    const [paidAmount, setPaidAmount] = useState<number>(0);

    // Default to the first customer's ID if available, otherwise null
    const [selectedCustomerId, setSelectedCustomerId] = useState<
        number | string
    >(customers[0]?.id || '');

    // 2. Initialize the cart state
    const [cart, setCart] = useState<CartItem[]>([]);

    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);

    // Error dialog state for customer selection
    const [showCustomerError, setShowCustomerError] = useState(false);

    /* Filter logic */
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === 'all' ||
            product.category_id === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // --- Calculation Logic ---

    const resetCheckoutFields = () => {
        setTaxPercent(0);
        setDiscountAmount(0);
        setTransportFee(0);
        setPaidAmount(0);
        setPaymentMethod('cash');
        setPaymentStatus('paid');
        setSelectedCustomerId(customers[0]?.id || '');
    };

    // 1. Calculate Base Subtotal from Cart
    const subTotal = cart.reduce(
        (acc, item) => acc + Number(item.selling_price) * item.qty,
        0,
    );

    // 2. Calculate Tax Value
    const taxAmount = (subTotal * taxPercent) / 100;

    // 3. Final Grand Total
    const grandTotal =
        subTotal + taxAmount - Number(discountAmount) - Number(transportFee);

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

    // 3. The Logic function
    const addToCart = (product: Product) => {
        setCart((prevCart) => {
            // Check if product already exists in cart
            const existingItem = prevCart.find(
                (item) => item.id === product.id,
            );

            if (existingItem) {
                // If it exists, map through and increase qty of that specific ID
                return prevCart.map((item) =>
                    item.id === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item,
                );
            }

            // If it's new, add it with qty 1
            return [...prevCart, { ...product, qty: 0 }];
        });
        // Wait a tiny moment for React to update the DOM, then focus the input
        setTimeout(() => {
            const inputField = document.getElementById(
                `qty-input-${product.id}`,
            ) as HTMLInputElement;
            if (inputField) {
                inputField.focus();
                // Optional: You can also call select() here so it highlights instantly!
                inputField.select();
            }
        }, 10);
    };

    // Decrease quantity or remove item
    const removeFromCart = (productId: number) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === productId);

            if (existingItem && existingItem.qty > 1) {
                // Just decrease the count
                return prevCart.map((item) =>
                    item.id === productId
                        ? { ...item, qty: item.qty - 1 }
                        : item,
                );
            }
            // If qty is 1, remove the whole row
            return prevCart.filter((item) => item.id !== productId);
        });
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;

        if (!selectedCustomerId) {
            setShowCustomerError(true);
            return;
        }

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
            customer_id: selectedCustomerId,
        };

        axios
            .post(route('sales.store'), payload)
            .then((response) => {
                if (response.data.success) {
                    setLastOrder(response.data.order);
                    setShowInvoiceModal(true);
                    setCart([]); // Clear cart after success
                    setPaidAmount(0);
                    toast.success('ការលក់ជោគជ័យ! (Sale Successful)');
                }
            })
            .catch(() => {
                toast.error('មានបញ្ហាក្នុងការទូទាត់ប្រាក់ (Payment Error)');
            })
            .finally(() => {
                setProcessing(false);
            });

        resetCheckoutFields();
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
                                    placeholder={t('pos.search')}
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
                                        selectedCategory === 'all'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setSelectedCategory('all')}
                                    className="rounded-full px-6"
                                >
                                    {t('all')}
                                </Button>
                                {categories.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant={
                                            selectedCategory === cat.id
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            setSelectedCategory(cat.id)
                                        }
                                        className="rounded-full px-6 font-sans"
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Grid for Categories */}
                    <div className="flex-1 overflow-y-auto pr-2 pb-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <Card
                                        onClick={() => addToCart(product)}
                                        key={product.id}
                                        className="overflow-hidden transition-shadow hover:shadow-lg"
                                    >
                                        {/* 1. ADD 'relative' HERE */}
                                        <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-indigo-100">
                                            {/* 2. THE BADGE (Now stays inside the relative box) */}
                                            {product.category_name && (
                                                <Badge
                                                    variant="secondary"
                                                    className="absolute top-2 right-2 z-20 bg-indigo-600 font-sans text-white opacity-90 shadow-sm hover:bg-indigo-700"
                                                >
                                                    {product.category_name}
                                                </Badge>
                                            )}

                                            {/* 3. CLEANED UP IMAGE RENDER */}
                                            <img
                                                src={
                                                    product.image
                                                        ? `/storage/${product.image}`
                                                        : '/images/placeholder.png'
                                                }
                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                alt={product.name}
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
                                                        {product.name}
                                                    </strong>
                                                </p>
                                                <p className="text-sm font-bold whitespace-nowrap text-indigo-700">
                                                    {currency}
                                                    {product.selling_price}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full rounded-xl border-2 border-dashed bg-gray-50 py-20 text-center">
                                    <p className="text-lg text-gray-500">
                                        No products found.
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
                            {t('pos.current_order')}
                        </h2>
                        {cart.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                onClick={clearCart}
                            >
                                {t('pos.clear_all')}
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
                                            Number(item.selling_price) *
                                            item.qty
                                        ).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        {currency}
                                        {item.selling_price} / {item.unit}
                                    </span>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 rounded-lg border bg-white p-1 shadow-sm">
                                        <button
                                            onClick={() =>
                                                removeFromCart(item.id)
                                            }
                                            className="flex h-6 w-6 items-center justify-center rounded font-bold text-red-600 transition-colors hover:bg-red-100"
                                        >
                                            -
                                        </button>
                                        <Input
                                            id={`qty-input-${item.id}`}
                                            type="number"
                                            min="0"
                                            value={
                                                item.qty === 0 ? '' : item.qty
                                            }
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => {
                                                // If the user clears the input (backspace), set it to 0 temporarily
                                                const val =
                                                    e.target.value === ''
                                                        ? 0
                                                        : Number(
                                                              e.target.value,
                                                          );

                                                // Allow 0 so the user can delete the current number before typing a new one
                                                if (val >= 0) {
                                                    setCart((prevCart) =>
                                                        prevCart.map(
                                                            (cartItem) =>
                                                                cartItem.id ===
                                                                item.id
                                                                    ? {
                                                                          ...cartItem,
                                                                          qty: val,
                                                                      }
                                                                    : cartItem,
                                                        ),
                                                    );
                                                }
                                            }}
                                            className="h-6 w-12 rounded border-none bg-gray-50 p-0 text-center text-xs font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                                        />
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="flex h-6 w-6 items-center justify-center rounded font-bold text-green-600 transition-colors hover:bg-green-100"
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
                            <span>{t('pos.sub_total')}</span>
                            <span>
                                {currency}
                                {subTotal.toFixed(2)}
                            </span>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                                {t('pos.customer')}
                            </label>
                            <select
                                value={selectedCustomerId}
                                onChange={(e) =>
                                    setSelectedCustomerId(e.target.value)
                                }
                                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 font-sans text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">ជ្រើសរើសអតិថិជន</option>
                                {customers.map((customer) => (
                                    <option
                                        key={customer.id}
                                        value={customer.id}
                                    >
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Adjustment Inputs */}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t('pos.tax')}
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
                                    {t('pos.discount')}
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
                                    {t('pos.transport_fee')}
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
                                {t('pos.payment_method')}
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
                                    <span className="text-[10px]">Cash</span>
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
                                    <span className="text-[10px]">ABA QR</span>
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
                                    <span className="text-[10px]">Wing</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 px-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                                {t('pos.payment_status')}
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
                                        {status === 'paid' && t('pos.paid')}
                                        {status === 'partial' &&
                                            t('pos.partial')}
                                        {status === 'due' && t('pos.due')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Final Grand Total */}
                        <div className="flex justify-between border-t pt-2 text-xl font-bold text-indigo-800">
                            <span>{t('pos.grand_total')}</span>
                            <span>
                                {currency}
                                {grandTotal.toFixed(2)}
                            </span>
                        </div>

                        {/* Paid Amount & Change */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                                {t('pos.paid_amount')}
                            </label>
                            <Input
                                type="number"
                                value={paidAmount}
                                onChange={(e) =>
                                    setPaidAmount(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : 0,
                                    )
                                }
                                onFocus={(e) => e.target.select()}
                                className="bg-yellow-50 text-lg font-bold"
                            />

                            {paidAmount > 0 && (
                                <div className="flex justify-between text-sm font-bold text-green-600">
                                    <span>{t('pos.change_amount')}</span>
                                    <span>
                                        {currency}
                                        {changeAmount.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={() => {
                                handleCheckout();

                                //Reset checkout fields
                                resetCheckoutFields();
                            }}
                            disabled={cart.length === 0 || processing}
                            className="w-full bg-indigo-700 py-6 text-lg font-bold hover:bg-indigo-900"
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
                                    {t('pos.processing')}
                                </span>
                            ) : (
                                '🛒 ' + t('pos.invoice')
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
                            {t('pos.invoice')}
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
                                    <p className="mt-1 text-[10px] tracking-widest text-gray-500">
                                        {settings['phone']}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h2 className="font-bold tracking-widest text-gray-800">
                                        {t('pos.invoice')}
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
                                        {t('pos.customer')}
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800">
                                        {lastOrder.customer?.name ||
                                            'Walk-in Customer'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="mb-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                                        {t('pos.date')}
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
                                    {t('pos.item')}
                                </div>
                                <div className="col-span-2 text-center">
                                    {t('pos.qty')}
                                </div>
                                <div className="col-span-2 text-right">
                                    {t('pos.price')}
                                </div>
                                <div className="col-span-2 text-right">
                                    {t('pos.total')}
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
                                        <span>{t('pos.sub_total')}</span>
                                        <span className="font-bold text-gray-800">
                                            {currency}
                                            {Number(
                                                lastOrder.sub_total || subTotal,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    {Number(lastOrder.tax_amount) > 0 && (
                                        <div className="flex justify-between">
                                            <span>{t('pos.tax')}</span>
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
                                            <span>{t('pos.discount')}</span>
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
                                            <span>
                                                {t('pos.transport_fee')}
                                            </span>
                                            <span className="font-bold text-red-500">
                                                -{currency}
                                                {Number(
                                                    lastOrder.transport_fee,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="mt-2 flex justify-between border-t-2 border-gray-800 pt-2">
                                        <span className="text-lg font-bold text-gray-800">
                                            {t('pos.total')}
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
                                        ? t('pos.paid')
                                        : `${lastOrder.payment_status === 'partial' ? t('pos.partial') : t('pos.due')}`}
                                </span>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-12 text-center text-[10px] font-bold text-gray-400 italic">
                                {t('pos.thanks')}
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

                                    // Reset checkout fields
                                    resetCheckoutFields();

                                    // Optional: close invoice modal after print
                                    setShowInvoiceModal(false);
                                }
                            }}
                        >
                            🖨️ {t('pos.print_invoice')}
                        </Button>
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                className="px-6 font-bold text-gray-500 hover:bg-gray-100"
                            >
                                {t('pos.close')}
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Customer Error Dialog */}
            <Dialog
                open={showCustomerError}
                onOpenChange={setShowCustomerError}
            >
                <DialogContent className="max-w-sm rounded-xl border-none p-6 text-center font-sans shadow-xl">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-gray-900">
                        សូមជ្រើសរើសអតិថិជន!
                    </h2>
                    <p className="mb-6 text-sm text-gray-500">
                        Please select a customer before proceeding with
                        checkout.
                    </p>
                    <Button
                        onClick={() => setShowCustomerError(false)}
                        className="text-md w-full bg-indigo-600 py-6 font-bold hover:bg-indigo-700"
                    >
                        យល់ព្រម (OK)
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'pos.title', href: '/pos' }],
};
