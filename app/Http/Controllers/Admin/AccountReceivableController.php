<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountReceivableController extends Controller
{
    public function index(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();

        $query = Order::with(['customer', 'user', 'details.product'])
            ->whereIn('payment_status', ['due', 'partial'])->orderBy('customer_id');

        // 🔍 SEARCH
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%$search%")
                    ->orWhereHas('customer', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%$search%")->orderBy('customer_id');
                    });
            });
        }

        $tz = 'Asia/Phnom_Penh';

        // 📅 PRESET FILTER
        if ($request->filled('preset') && ! in_array($request->preset, ['all', 'custom'])) {

            switch ($request->preset) {
                case 'today':
                    $query->whereDate('order_date', Carbon::today($tz));
                    break;

                case 'yesterday':
                    $query->whereDate('order_date', Carbon::yesterday($tz));
                    break;

                case 'last_week':
                    $query->whereBetween('order_date', [
                        Carbon::now($tz)->subWeek()->startOfWeek(),
                        Carbon::now($tz)->subWeek()->endOfWeek(),
                    ]);
                    break;

                case 'last_month':
                    $query->whereBetween('order_date', [
                        Carbon::now($tz)->subMonth()->startOfMonth(),
                        Carbon::now($tz)->subMonth()->endOfMonth(),
                    ]);
                    break;

                case 'this_month':
                    $query->whereBetween('order_date', [
                        Carbon::now($tz)->startOfMonth(),
                        Carbon::now($tz)->endOfMonth(),
                    ]);
                    break;
            }
        }

        // ✅ CUSTOM DATE RANGE (FIXED)
        if ($request->preset === 'custom' && $request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('order_date', [
                Carbon::parse($request->from_date)->startOfDay(),
                Carbon::parse($request->to_date)->endOfDay(),
            ]);
        }

        // 💰 TOTAL DUE (optimized)
        $totalDue = (clone $query)
            ->get()
            ->sum(function ($ord) {
                return (float) $ord->total_amount - (float) $ord->paid_amount;
            });

        $orders = $query->paginate(10)->withQueryString();

        return Inertia::render('account_receivable/index', [
            'orders' => $orders,
            'totalDue' => $totalDue,
            'filters' => $request->only(['search', 'preset', 'from_date', 'to_date']),
            'settings' => $settings,
        ]);
    }

    public function update(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'paid_amount' => 'required|numeric|min:0',
            'due_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|string',
            'payment_method' => 'required|string',
            'order_date' => 'required|date',
        ]);

        $order->update([
            'paid_amount' => $request->paid_amount,
            'due_amount' => $request->due_amount,
            'payment_status' => $request->payment_status,
            'payment_method' => $request->payment_method,
            'order_date' => $request->order_date,
        ]);

        return response()->json([
            'success' => true,
        ]);
    }
}
