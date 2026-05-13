<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;


class PurchaseItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $suppliers = Supplier::all();
        $purchase_items = PurchaseItem::with('supplier')->latest()->get()->map(function ($purchase_item) {
            return [
                'id'           => $purchase_item->id,
                'name'         => $purchase_item->name,
                'supplier_id'  => $purchase_item->supplier_id,
                'supplier_name'=> $purchase_item->supplier?->name ?? 'N/A',
                'unit'         => $purchase_item->unit,
                'price'        => $purchase_item->price,
                'image'        => $purchase_item->image ? Storage::url($purchase_item->image) : null,
            ];  
        });


        return Inertia::render('purchase_item/index', [
            'purchase_items' => $purchase_items,
            'suppliers' => $suppliers,
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
        $validated = $request->validate([
            'supplier_id' => 'required',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:255',
            'price' => 'nullable|numeric',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ],[
            'supplier_id.required' => 'Supplier is required',
            'name.required' => 'Name is required',
            'unit.required' => 'Unit is required',
        ]);

        $purchaseItem = new PurchaseItem();
        $purchaseItem->supplier_id = $validated['supplier_id'];
        $purchaseItem->name = $validated['name'];
        $purchaseItem->unit = $validated['unit'];
        $purchaseItem->price = $validated['price'];

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('purchase_items', 'public');
            $purchaseItem->image = $path; // 🔥 IMPORTANT
        }

        $purchaseItem->save();

        return redirect()->route('purchase-item.index')
            ->with('success', 'Purchase item created successfully.');
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
        $purchase_item = PurchaseItem::findOrFail($id);
        $validated = $request->validate([
            'supplier_id' => 'required',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:255',
            'price' => 'required|numeric',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ],[
            'supplier_id.required' => 'Supplier is required',
            'name.required' => 'Name is required',
            'unit.required' => 'Unit is required',
            'price.required' => 'Price is required',
        ]);

         if ($request->hasFile('image')) {
            // Delete old image
            if ($purchase_item->image) {
                Storage::disk('public')->delete($purchase_item->image);
            }
            $validated['image'] = $request->file('image')->store('purchase_items', 'public');
        } else {
            // Keep existing image path (don't overwrite with null)
            unset($validated['image']);
        }

        PurchaseItem::where('id', $id)->update($validated);

        return redirect()->route('purchase-item.index')
            ->with('success', 'Purchase item updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        PurchaseItem::where('id', $id)->delete();

        return redirect()->route('purchase-item.index')
            ->with('success', 'Purchase item deleted successfully.');
    }
}
