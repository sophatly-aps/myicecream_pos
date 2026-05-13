<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\Category;
use Carbon\Carbon;
use App\Models\Setting;
use DB;

class DashboardController extends Controller
{
    public function index()
{
    $range = request('range');
    $from = request('from');
    $to = request('to');

    $settings = Setting::pluck('value', 'key')->toArray();

    if ($range === 'all') {
    $from = null;
    $to = null;

} elseif ($range === 'today') {
    $from = now()->startOfDay();
    $to = now()->endOfDay();

} elseif ($range === 'last_week') {
    $from = now()->subDays(7)->startOfDay();
    $to = now()->endOfDay();

} elseif ($range === 'this_month') {
    $from = now()->startOfMonth();
    $to = now()->endOfMonth();

} elseif ($range === 'last_month') {
    $from = now()->subMonth()->startOfMonth();
    $to = now()->subMonth()->endOfMonth();

} elseif ($from && $to) {
    $from = \Carbon\Carbon::parse($from)->startOfDay();
    $to = \Carbon\Carbon::parse($to)->endOfDay();
}

    // 🔥 Metrics
    $query = Order::query();
    if ($from && $to) {
    $query->whereBetween('order_date', [$from, $to]);
}

    $totalRevenue = $query->sum('total_amount');
    $totalOrder = $query->count();
    $averageSale = $totalOrder > 0 ? $totalRevenue / $totalOrder : 0;
    $totalDiscount = $query->sum('discount_amount');

    // 🔥 Sales Overview (chart)
    $salesQuery = Order::query();
    if ($from && $to) {
    $salesQuery->whereBetween('order_date', [$from, $to]);
}
    $salesOverview = $salesQuery
    ->selectRaw('DATE(order_date) as date, SUM(total_amount) as total')
    ->groupBy('date')
    ->orderBy('date')
    ->get();

    // 🔥 Payment Methods
    $paymentQuery = Order::query();

    if ($from && $to) {
        $paymentQuery->whereBetween('order_date', [$from, $to]);
    }

$paymentMethods = $paymentQuery
    ->selectRaw('payment_method as name, COUNT(*) as value')
    ->groupBy('payment_method')
    ->get();

    // 🔥 Popular Menu
    $popularMenu = OrderDetail::with('product')
    ->when($from && $to, function ($q) use ($from, $to) {
        $q->whereHas('order', function ($sub) use ($from, $to) {
            $sub->whereBetween('order_date', [$from, $to]);
        });
    })
    ->selectRaw('product_id, SUM(quantity) as sold_quantity, SUM(subtotal) as total_income')
    ->groupBy('product_id')
    ->orderByDesc('sold_quantity')
    ->take(10)
    ->get()
    ->map(function ($item) {
        return [
            'name' => $item->product->name ?? '',
            'image' => $item->product?->image
    ? asset('storage/' . $item->product->image)
    : null,
            'price' => $item->product->selling_price ?? 0,
            'sold_quantity' => $item->sold_quantity,
            'total_income' => $item->total_income,
            'discount' => 0
        ];
    });

    return inertia('dashboard', [
        'metrics' => [
            'totalRevenue' => [
                'value' => $totalRevenue,
                'trend' => 0 // you can calculate later
            ],
            'totalOrder' => [
                'value' => $totalOrder,
                'trend' => 0
            ],
            'averageSale' => [
                'value' => $averageSale,
                'trend' => 0
            ],
            'totalDiscount' => [
                'value' => $totalDiscount,
                'trend' => 0
            ],
        ],
       
        'settings' => $settings,
        'salesOverview' => $salesOverview,
        'paymentMethods' => $paymentMethods,
        'popularMenu' => $popularMenu,
        'startDate' => $from ? $from->toDateString() : 'all',
        'endDate' => $to ? $to->toDateString() : '',
    ]);
}

    private function calculateTrend($current, $previous) {
        if ($previous == 0) return $current > 0 ? 100 : 0;
        return round((($current - $previous) / $previous) * 100, 1);
    }
}
