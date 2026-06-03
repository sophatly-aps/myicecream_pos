<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Purchase;
use App\Models\Setting;
use Carbon\Carbon;

class PurchaseHistoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();

        $currency = $settings['currency_symbol'] ?? '$';

        $purchase_items = \App\Models\PurchaseItem::all();

        return Inertia::render('purchase/history',[
            'currency' => $currency,
            'purchase_items' => $purchase_items,
        ]);
    }

    public function data(Request $request)
    {
        $filter = $request->filter;

        $query = Purchase::with(['details.purchase_item']);

        
        if ($request->filter === 'trash') {
            $query->onlyTrashed();
        }

        if ($filter === 'all') {
            // no filter
        }

        // your existing filter logic...
        if ($filter === 'today') {
            $query->whereDate('purchase_date', now());
        }

        if ($filter === 'last_week') {
            $query->whereBetween('purchase_date', [
                now()->subWeek(),
                now()
            ]);
        }

        if ($filter === 'last_month') {
            $query->whereMonth('purchase_date', now()->subMonth()->month);
        }

        if ($filter === 'this_month') {
            $query->whereMonth('purchase_date', now()->month);
        }

        if ($filter === 'custom' && $request->from && $request->to) {
            $query->whereBetween('purchase_date', [
                $request->from,
                $request->to
            ]);
        }

        // ✅ get currency from DB
        $currency = Setting::first()?->currency_symbol ?? '$';

        // ✅ IMPORTANT: use paginate()
        $purchases = $query
            ->latest()
            ->paginate(10); // 10 per page

        return response()->json([
            'data' => $purchases->items(),
            'meta' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
            ],
            'links' => [
                'next' => $purchases->nextPageUrl(),
                'prev' => $purchases->previousPageUrl(),
            ],
            'currency' => $currency,
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
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $purchase = Purchase::with('details.purchase_item')
        ->findOrFail($id);
        $settings = Setting::pluck('value', 'key')->toArray();
        return response()->json([
            'data' => $purchase,
            'settings' => $settings,
        ]);
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
        $purchase = Purchase::with('details')->findOrFail($id);

        // Update main purchase fields
        $purchase->update([
            'purchase_date' => $request->purchase_date ?? $purchase->purchase_date,
            'transport_fee' => $request->transport_fee ?? 0,
            'tax_amount' => $request->tax_amount ?? 0,
            'discount_amount' => $request->discount_amount ?? 0,
            'total_amount' => $request->total_amount ?? 0,
            'purchase_method' => $request->purchase_method ?? $purchase->purchase_method,
            'purchase_status' => $request->purchase_status ?? $purchase->purchase_status,
        ]);

        $existingIds = $purchase->details()->pluck('id')->toArray();
        $updatedIds = [];

        // Update details
        foreach ($request->details as $item) {
            if (isset($item['id']) && in_array($item['id'], $existingIds)) {
                $detail = $purchase->details()->where('id', $item['id'])->first();
                if ($detail) {
                    $detail->update([
                        'qty' => $item['qty'],
                        'price' => $item['price'],
                    ]);
                    $updatedIds[] = $detail->id;
                }
            } else {
                $newDetail = $purchase->details()->create([
                    'purchase_item_id' => $item['purchase_item_id'] ?? ($item['purchase_item']['id'] ?? null),
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                    'unit' => $item['unit'] ?? ($item['purchase_item']['unit'] ?? ''),
                ]);
                $updatedIds[] = $newDetail->id;
            }
        }

        $deletedIds = array_diff($existingIds, $updatedIds);
        if (!empty($deletedIds)) {
            $purchase->details()->whereIn('id', $deletedIds)->delete();
        }

        return response()->json([
            'message' => 'Updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $purchase = Purchase::findOrFail($id);

        $purchase->details()->delete();
        $purchase->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function restore($id)
    {
        $purchase = Purchase::onlyTrashed()->findOrFail($id);
        $purchase->restore();
        $purchase->details()->restore();

        return response()->json(['message' => 'Restored successfully']);
    }

    public function forceDelete($id)
    {
        $purchase = Purchase::onlyTrashed()->findOrFail($id);

        $purchase->details()->forceDelete(); // clean children
        $purchase->forceDelete();

        return response()->json(['message' => 'Permanently deleted']);
    }

}
