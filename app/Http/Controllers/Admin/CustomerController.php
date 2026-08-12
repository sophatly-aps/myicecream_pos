<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Setting;
use App\Models\Order;
use App\Models\RentPayment;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $settings = Setting::pluck('value', 'key')->toArray();
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
            'settings' => $settings,
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
            'start_date' => 'nullable|date',
            'rent_due_date' => 'nullable|date',
            'rent_amount' => 'nullable|numeric',
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
            'start_date' => 'nullable|date',
            'rent_due_date' => 'nullable|date',
            'rent_amount' => 'nullable|numeric',
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

    public function payRent(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'payment_date' => 'required|date',
            'payment_amount' => 'required|numeric|min:0',
            'next_due_date' => 'required|date|after:payment_date',
        ]);

        $customer->update([
            'rent_due_date' => $validated['next_due_date'],
            'last_paid_date' => $validated['payment_date'],
            'rent_amount' => $validated['payment_amount'],
        ]);

        RentPayment::create([
            'customer_id' => $customer->id,
            'payment_date' => $validated['payment_date'],
            'amount' => $validated['payment_amount'],
            'next_due_date' => $validated['next_due_date'],
            'notes' => $request->notes ?? null,
        ]);
        

        return response()->json([
            'message' => 'Rent payment recorded successfully',
            'customer' => $customer->fresh(['parent', 'subCustomers'])
        ]);
    }

     public function rentHistory($id)
    {
        $customer = Customer::with(['rentPayments' => function($query) {
            $query->orderBy('payment_date', 'desc');
        }])->findOrFail($id);

        $settings = Setting::pluck('value', 'key')->toArray();

        return Inertia::render('customers/rent-history', [
            'customer' => $customer,
            'rentPayments' => $customer->rentPayments,
            'settings' => $settings,
        ]);
    }

    /**
     * Get rent payment history as JSON (for API/export)
     */
    public function getRentHistoryApi($id)
    {
        $customer = Customer::with(['rentPayments' => function($query) {
            $query->orderBy('payment_date', 'desc');
        }])->findOrFail($id);

        return response()->json([
            'customer' => $customer,
            'rentPayments' => $customer->rentPayments
        ]);
    }

    /**
     * Export rent payment history
     */
    public function exportRentHistory($id)
    {
        $customer = Customer::with(['rentPayments' => function($query) {
            $query->orderBy('payment_date', 'desc');
        }])->findOrFail($id);

        // Generate CSV
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=rent_history_{$customer->name}.csv",
        ];

        $callback = function() use ($customer) {
            $file = fopen('php://output', 'w');
            
            // Add headers
            fputcsv($file, ['Payment Date', 'Amount', 'Next Due Date', 'Notes']);
            
            // Add data
            foreach ($customer->rentPayments as $payment) {
                fputcsv($file, [
                    $payment->payment_date,
                    $payment->amount,
                    $payment->next_due_date,
                    $payment->notes ?? '',
                ]);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }


}
