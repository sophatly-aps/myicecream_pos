<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $products = Product::with('category')->withCount('orderDetails')->latest()->get()->map(function ($product) {
            return [
                'id'           => $product->id,
                'name'         => $product->name,
                'category_id'  => $product->category_id,
                'category_name'=> $product->category?->name ?? 'N/A',
                'unit'         => $product->unit,
                'base_price'   => $product->base_price,
                'selling_price'=> $product->selling_price,
                'image'        => $product->image ? Storage::url($product->image) : null,
                'created_at'   => $product->created_at->format('d-m-Y'),
                'status'       => $product->status,
                'has_orders'   => $product->order_details_count > 0,
            ];  
        });

        $categories = Category::where('status', 'active')->get(['id', 'name']);

        return Inertia::render('products/index', [
            'products'   => $products,
            'categories' => $categories,
            'settings'   => $settings,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'category_id'   => 'required|exists:categories,id',
            'unit'          => 'nullable|string|max:100',
            'base_price'    => 'nullable|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'status'        => 'required|in:active,inactive',
        ], [
            'name.required'          => 'Please enter the product name.',
            'category_id.required'   => 'Please select a category.',
            'category_id.exists'     => 'Selected category does not exist.',
            'selling_price.required' => 'Please enter the selling price.',
            'selling_price.numeric'  => 'Selling price must be a number.',
            'image.image'            => 'The file must be an image.',
            'image.max'              => 'Image must be less than 2MB.',
            'status.required'        => 'Please select a status.',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        Product::create($validated);

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'category_id'   => 'required|exists:categories,id',
            'unit'          => 'nullable|string|max:100',
            'base_price'    => 'nullable|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'status'        => 'required|in:active,inactive',
        ], [
            'name.required'          => 'Please enter the product name.',
            'category_id.required'   => 'Please select a category.',
            'category_id.exists'     => 'Selected category does not exist.',
            'selling_price.required' => 'Please enter the selling price.',
            'selling_price.numeric'  => 'Selling price must be a number.',
            'image.image'            => 'The file must be an image.',
            'image.max'              => 'Image must be less than 2MB.',
            'status.required'        => 'Please select a status.',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        } else {
            // Keep existing image path (don't overwrite with null)
            unset($validated['image']);
        }

        $product->update($validated);

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);

        if (\App\Models\OrderDetail::where('product_id', $product->id)->exists()) {
            return redirect()->back()->withErrors(['product' => 'Cannot delete this product because it has already been sold.']);
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully.');
    }
}
