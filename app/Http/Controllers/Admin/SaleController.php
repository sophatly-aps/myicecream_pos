<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $company_name = $settings['name'];

        $products = Product::with('category')->where('status', 'active')->get()->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'category_id' => $product->category_id,
                'category_name' => $product->category->name,
                'unit' => $product->unit,
                'base_price' => $product->base_price,
                'selling_price' => $product->selling_price,
                'image' => $product->image,
                'status' => $product->status,
            ];
        });
        $categories = Category::where('status', 'active')->get();
        $customers = Customer::where('status', 'active')->get();

        return Inertia::render('pos/index', [
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'settings' => $settings,
            'company_name' => $company_name,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'cart' => 'required|array|min:1',
            'total_amount' => 'required|numeric',
            'payment_method' => 'required|string',
        ]);

        return DB::transaction(function () use ($request) {
            // Use Carbon to get the current date in Cambodia timezone
            $currentDate = Carbon::now('Asia/Phnom_Penh')->format('Y-m-d');
            $dueAmount = $request->total_amount - ($request->paid_amount ?? 0);
            $order = Order::create([
                'invoice_no' => 'INV-'.date('ymd').'-'.mt_rand(1000, 9999),
                'order_date' => $currentDate, // <--- RECORDING THE DATE HERE
                'tax_amount' => $request->tax_amount ?? 0,
                'transport_fee' => $request->transport_fee ?? 0,
                'discount_amount' => $request->discount_amount ?? 0,
                'sub_total' => $request->sub_total ?? 0,
                'total_amount' => $request->total_amount,
                'paid_amount' => $request->paid_amount ?? 0,
                'change_amount' => $request->change_amount ?? 0,
                'due_amount' => $dueAmount,
                'payment_status' => $request->payment_status,
                'payment_method' => $request->payment_method,
                'user_id' => Auth::id(),
                'customer_id' => $request->customer_id ?? 1, // Default to Guest if null
            ]);

            // 2. Create Order Details
            foreach ($request->cart as $item) {
                OrderDetail::create([
                    'order_id' => $order->id,
                    'product_id' => $item['id'],
                    'quantity' => $item['qty'],
                    'unit' => $item['unit'],
                    'price' => $item['selling_price'],
                    'subtotal' => $item['qty'] * $item['selling_price'],
                ]);
            }

            $order->load(['details.product', 'customer', 'cashier']);

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'order' => $order,
                ]);
            }

            return redirect()->route('sales.receipt', $order->id);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'order_date' => 'required|date',
            'payment_method' => 'required|string',
            'payment_status' => 'required|string',
            'paid_amount' => 'required|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'customer_id' => 'nullable|integer',
        ]);

        $order = Order::findOrFail($id);

        $change_amount = $request->paid_amount > $order->total_amount
                         ? $request->paid_amount - $order->total_amount
                         : 0;

        $due_amount = $request->has('due_amount') 
                      ? $request->due_amount 
                      : max(0, $order->total_amount - $request->paid_amount);

        $data = [
            'order_date' => $request->order_date,
            'payment_method' => $request->payment_method,
            'payment_status' => $request->payment_status,
            'paid_amount' => $request->paid_amount,
            'change_amount' => $change_amount,
            'due_amount' => $due_amount,
        ];

        if ($request->has('customer_id')) {
            $data['customer_id'] = $request->customer_id;
        }

        $order->update($data);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true]);
        }

        return redirect()->back();
    }

    public function destroy(string $id)
    {
        $order = Order::findOrFail($id);

        $order->details()->delete();
        $order->delete();

        if (request()->wantsJson() && !request()->header('X-Inertia')) {
            return response()->json(['message' => 'Deleted successfully']);
        }
        return redirect()->back();
    }

    public function restore($id)
    {
        $order = Order::onlyTrashed()->findOrFail($id);
        $order->restore();
        $order->details()->restore();

        if (request()->wantsJson() && !request()->header('X-Inertia')) {
            return response()->json(['message' => 'Restored successfully']);
        }
        return redirect()->back();
    }

    public function forceDelete($id)
    {
        $order = Order::onlyTrashed()->findOrFail($id);

        $order->details()->forceDelete(); // clean children
        $order->forceDelete();

        if (request()->wantsJson() && !request()->header('X-Inertia')) {
            return response()->json(['message' => 'Permanently deleted']);
        }
        return redirect()->back();
    }

    public function downloadReceipt($id)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'] ?? '$';
        $order = Order::with('details.product', 'cashier')->findOrFail($id);

        // Setup mPDF with Khmer Font support
        $defaultConfig = (new ConfigVariables)->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];

        $defaultFontConfig = (new FontVariables)->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];

        $mpdf = new Mpdf([
            'fontDir' => array_merge($fontDirs, [resource_path('fonts')]),
            'fontdata' => $fontData + [
                'khmeros' => [
                    'R' => 'KhmerOS.ttf',
                    'useOTL' => 0xFF,
                ],
            ],
            'default_font' => 'khmeros',
            'format' => [80, 200], // 80mm width for thermal printers
            'margin_left' => 5,
            'margin_right' => 5,
        ]);

        $html = view('pdf.receipt', compact('order', 'currency'))->render();
        $mpdf->WriteHTML($html);

        return $mpdf->Output("Receipt-{$order->invoice_no}.pdf", 'I');
    }
}
