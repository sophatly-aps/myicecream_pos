<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PurchaseItem;
use App\Models\Setting;
use App\Models\Supplier;
use Inertia\Inertia;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PurchaseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $purchase_items = PurchaseItem::with('supplier')->get()->map(function ($purchase_item) {
            return [
                'id' => $purchase_item->id,
                'name' => $purchase_item->name,
                'supplier_id' => $purchase_item->supplier_id,
                'supplier_name' => $purchase_item->supplier->name,
                'unit' => $purchase_item->unit,
                'price' => $purchase_item->price,
                'image' => $purchase_item->image,
            ];
        });
        $suppliers = Supplier::where('status','active')->get();

        return Inertia::render('purchase/index', [
            'purchase_items' => $purchase_items,
            'suppliers' => $suppliers,
            'settings' => $settings,
        ]);//
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

        $date = Carbon::now('Asia/Phnom_Penh')->toDateString();
        $prefix = Carbon::now('Asia/Phnom_Penh')->format('Ymd');


         $request->validate([
            'cart' => 'required|array|min:1',
            'total_amount' => 'required|numeric',
            'payment_method' => 'required|string',
        ]);
        

        return DB::transaction(function () use ($request) {
            // Use Carbon to get the current date in Cambodia timezone
            $currentDate = Carbon::now('Asia/Phnom_Penh')->format('Y-m-d');

            $purchase = Purchase::create([
                'purchase_no'     => 'PO-' . date('ymd') . '-' . mt_rand(1000, 9999),
                'purchase_date'     => $currentDate, // <--- RECORDING THE DATE HERE
                'tax_amount'     => $request->tax_amount ?? 0,
                'transport_fee'  => $request->transport_fee ?? 0,
                'discount_amount'=> $request->discount_amount ?? 0,
                'total_amount'   => $request->total_amount,
                'user_id'        => Auth::id(),
            ]);

            // 2. Create Order Details
            foreach ($request->cart as $item) {
                PurchaseDetail::create([
                    'purchase_id' => $purchase->id,
                    'purchase_item_id' => $item['id'],
                    'qty' => $item['qty'],
                    'unit' => $item['unit'],
                    'price' => $item['price'],
                    'total_amount' => $item['qty'] * $item['price'],
                ]);
            }
            
            $purchase->load(['details.purchase_item']);

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'purchase' => $purchase
                ]);
            }

           return redirect()->back();
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

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
