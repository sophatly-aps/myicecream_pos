<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Order;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
       $query = Customer::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $customers = $query->with(['parent', 'subCustomers'])
            ->withCount('orders')
            ->orderByRaw('COALESCE(parent_id, id) DESC')
            ->orderByRaw('parent_id IS NOT NULL ASC')
            ->orderBy('id', 'DESC')
            ->paginate(10);

        $parentCustomers = Customer::whereNull('parent_id')->select('id', 'name')->get();

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'parentCustomers' => $parentCustomers,
            'filters' => $request->only('search')
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
            'parent_id' => 'nullable|exists:customers,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'other_info' => 'nullable|string|max:255',
            'status' => 'required|string|max:255',
        ],[
            'name.required' => 'Name is required',
            'phone.required' => 'Phone is required',
            'status.required' => 'Status is required',
        ]);

        if (!$request->has('parent_id')) {
            $validated['parent_id'] = null;
        }

        Customer::create($validated);

        return redirect()->route('customers.index')
            ->with('success', 'Customer created successfully!');
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
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:customers,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'other_info' => 'nullable|string|max:255',
            'status' => 'required|string|max:255',
        ],[
            'name.required' => 'Name is required',
            'phone.required' => 'Phone is required',
            'status.required' => 'Status is required',
        ]);

        if (!$request->has('parent_id')) {
            $validated['parent_id'] = null;
        }

        $customer = Customer::findOrFail($id);
        $customer->update($validated);

        return redirect()->route('customers.index')
            ->with('success', 'Customer updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $customer = Customer::findOrFail($id);

        if ($customer->orders()->exists()) {
            return redirect()->back()->withErrors([
                'delete' => 'Can not delete customer. This customer has existing orders.'
            ]);
        }
        $customer->delete();

        return redirect()->route('customers.index')
            ->with('success', 'Customer deleted successfully!');
    }

    public function statement($id)
    {
        $customer = Customer::with('subCustomers')->findOrFail($id);
        
        $customerIds = collect([$customer->id])->merge($customer->subCustomers->pluck('id'));
        
        $orders = Order::whereIn('customer_id', $customerIds)
            ->with(['customer', 'details.product'])
            ->orderBy('order_date', 'desc')
            ->get();
            
        return response()->json([
            'customer' => $customer,
            'orders' => $orders
        ]);
    }
}
