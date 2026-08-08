<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;

class SaleByCustomerController extends Controller
{
    public function index(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $company_name = $settings['name'] ?? '';

        $query = Order::query()
            ->select(
                'customer_id',
                DB::raw('COUNT(id) as total_orders'),
                DB::raw('SUM(total_amount) as total_amount'),
                DB::raw('SUM(paid_amount) as paid_amount'),
                DB::raw('SUM(due_amount) as due_amount')
            )
            ->with('customer.parent');

        if ($request->filled('customer_id') && $request->customer_id !== 'all') {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('preset') && $request->preset !== 'custom' && $request->preset !== 'all') {
            $preset = $request->preset;
            $tz = 'Asia/Phnom_Penh';

            if ($preset === 'today') {
                $query->whereDate('order_date', Carbon::today($tz));
            } elseif ($preset === 'yesterday') {
                $query->whereDate('order_date', Carbon::yesterday($tz));
            } elseif ($preset === 'last_week') {
                $query->whereBetween('order_date', [
                    Carbon::today($tz)->subWeek()->startOfWeek(),
                    Carbon::today($tz)->subWeek()->endOfWeek(),
                ]);
            } elseif ($preset === 'last_month') {
                $query->whereBetween('order_date', [
                    Carbon::today($tz)->subMonth()->startOfMonth(),
                    Carbon::today($tz)->subMonth()->endOfMonth(),
                ]);
            }
        } else {
            if ($request->filled('from_date')) {
                $query->whereDate('order_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('order_date', '<=', $request->to_date);
            }
        }

        // Group by customer
        $query->groupBy('customer_id');

        // Calculate totals for the current filtered query
        // Since it's a grouped query, we can use get() and then sum, or use DB::table
        $allResults = $query->get();
        $grandTotalAmount = $allResults->sum('total_amount');
        $grandTotalPaid = $allResults->sum('paid_amount');
        $grandTotalDue = $allResults->sum('due_amount');

        // Pagination
        $orders = $query->paginate(10)->withQueryString();

        $customers = Customer::where('status', 'active')->orderBy('name')->get();

        return Inertia::render('reports/sale_by_customer', [
            'orders' => $orders,
            'totals' => [
                'total_amount' => $grandTotalAmount,
                'paid_amount' => $grandTotalPaid,
                'due_amount' => $grandTotalDue,
            ],
            'filters' => $request->only(['customer_id', 'from_date', 'to_date', 'preset']),
            'settings' => $settings,
            'company_name' => $company_name,
            'customers' => $customers,
        ]);
    }

    public function export(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'] ?? '$';

        $query = Order::query()
            ->select(
                'customer_id',
                DB::raw('COUNT(id) as total_orders'),
                DB::raw('SUM(total_amount) as total_amount'),
                DB::raw('SUM(paid_amount) as paid_amount'),
                DB::raw('SUM(due_amount) as due_amount')
            )
            ->with('customer.parent');

        if ($request->filled('customer_id') && $request->customer_id !== 'all') {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('preset') && $request->preset !== 'custom' && $request->preset !== 'all') {
            $preset = $request->preset;
            $tz = 'Asia/Phnom_Penh';

            if ($preset === 'today') {
                $query->whereDate('order_date', Carbon::today($tz));
            } elseif ($preset === 'yesterday') {
                $query->whereDate('order_date', Carbon::yesterday($tz));
            } elseif ($preset === 'last_week') {
                $query->whereBetween('order_date', [
                    Carbon::today($tz)->subWeek()->startOfWeek(),
                    Carbon::today($tz)->subWeek()->endOfWeek(),
                ]);
            } elseif ($preset === 'last_month') {
                $query->whereBetween('order_date', [
                    Carbon::today($tz)->subMonth()->startOfMonth(),
                    Carbon::today($tz)->subMonth()->endOfMonth(),
                ]);
            }
        } else {
            if ($request->filled('from_date')) {
                $query->whereDate('order_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('order_date', '<=', $request->to_date);
            }
        }

        $query->groupBy('customer_id');
        $orders = $query->get();

        if ($request->query('format') === 'excel') {
            $headers = [
                'Content-type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename=sale_by_customer_'.date('Ymd_His').'.csv',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            $callback = function () use ($orders, $currency) {
                if (ob_get_level() > 0) {
                    ob_end_clean();
                }
                $file = fopen('php://output', 'w');
                // Add BOM for Excel UTF-8 support
                fwrite($file, $bom = (chr(0xEF).chr(0xBB).chr(0xBF)));
                fputcsv($file, ['Customer', 'Total Orders', 'Total Amount ('.$currency.')', 'Paid Amount ('.$currency.')', 'Due Amount ('.$currency.')']);

                foreach ($orders as $order) {
                    $customerName = 'Walk-in Customer';
                    if ($order->customer) {
                        $customerName = $order->customer->parent 
                            ? $order->customer->parent->name . ' - ' . $order->customer->name 
                            : $order->customer->name;
                    }
                    
                    fputcsv($file, [
                        $customerName,
                        $order->total_orders,
                        $order->total_amount,
                        $order->paid_amount,
                        $order->due_amount,
                    ]);
                }
                fclose($file);
            };

            return Response::stream($callback, 200, $headers);
        }

        return back();
    }
}
