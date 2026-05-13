<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Setting;
use App\Models\Customer;

class SaleDetailController extends Controller
{
    public function index(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $company_name = $settings['name'];

        $query = Order::with(['customer', 'user', 'details.product'])->orderBy('id', 'desc');

        if ($request->filled('preset') && $request->preset === 'trash') {
            $query->onlyTrashed();
        }

        if ($request->filled('invoice_no')) {
            $query->where('invoice_no', 'like', '%' . $request->invoice_no . '%');
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
                    Carbon::today($tz)->subWeek()->endOfWeek()
                ]);
            } elseif ($preset === 'last_month') {
                $query->whereBetween('order_date', [
                    Carbon::today($tz)->subMonth()->startOfMonth(),
                    Carbon::today($tz)->subMonth()->endOfMonth()
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

        // Calculate totals for the current filtered query before pagination
        $grandTotal = (clone $query)->sum('total_amount');

        $orders = $query->paginate(10)->withQueryString();

        $customers = Customer::where('status', 'active')->get();

        return Inertia::render('sales/history', [
            'orders' => $orders,
            'grandTotal' => $grandTotal,
            'filters' => $request->only(['invoice_no', 'from_date', 'to_date', 'preset']),
            'settings' => $settings,
            'company_name' => $company_name,
            'customers' => $customers,
        ]);
    }
    public function export(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'] ?? '$';

        $query = Order::with(['customer', 'user', 'details.product'])->orderBy('id', 'desc');

        if ($request->filled('preset') && $request->preset === 'trash') {
            $query->onlyTrashed();
        }

        if ($request->filled('invoice_no')) {
            $query->where('invoice_no', 'like', '%' . $request->invoice_no . '%');
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
                    Carbon::today($tz)->subWeek()->endOfWeek()
                ]);
            } elseif ($preset === 'last_month') {
                $query->whereBetween('order_date', [
                    Carbon::today($tz)->subMonth()->startOfMonth(),
                    Carbon::today($tz)->subMonth()->endOfMonth()
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

        $orders = $query->get();

        if ($request->query('format') === 'excel') {
            $headers = [
                "Content-type"        => "text/csv; charset=UTF-8",
                "Content-Disposition" => "attachment; filename=sales_history_" . date('Ymd_His') . ".csv",
                "Pragma"              => "no-cache",
                "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
                "Expires"             => "0"
            ];
            
            $callback = function() use($orders, $currency) {
                if(ob_get_level() > 0) ob_end_clean();
                $file = fopen('php://output', 'w');
                // Add BOM for Excel UTF-8 support
                fputs($file, $bom =(chr(0xEF) . chr(0xBB) . chr(0xBF)));
                fputcsv($file, ['ID', 'Invoice No', 'Customer', 'Date', 'Sub Total (' . $currency . ')', 'Tax (' . $currency . ')', 'Discount (' . $currency . ')', 'Transport Fee (' . $currency . ')', 'Total (' . $currency . ')', 'Paid Amount (' . $currency . ')', 'Method', 'Status']);
                
                foreach ($orders as $order) {
                    fputcsv($file, [
                        $order->id,
                        $order->invoice_no,
                        $order->customer->name ?? 'Walk-in Customer',
                        date('d/m/Y', strtotime($order->order_date)),
                        $order->sub_total,
                        $order->tax_amount,
                        $order->discount_amount,
                        $order->transport_fee,
                        $order->total_amount,
                        $order->paid_amount,
                        $order->payment_method,
                        $order->payment_status,
                    ]);
                }
                fclose($file);
            };
            
            return \Illuminate\Support\Facades\Response::stream($callback, 200, $headers);
        }

        return back();
    }
}
