<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountPayableController extends Controller
{
    public function index(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();

        $query = Purchase::with(['details.purchase_item'])
            ->whereIn('purchase_status', ['due', 'partial'])->orderBy('id', 'desc');

        $tz = 'Asia/Phnom_Penh';

        // 📅 PRESET FILTER
        if ($request->filled('preset') && ! in_array($request->preset, ['all', 'custom'])) {

            switch ($request->preset) {
                case 'today':
                    $query->whereDate('purchase_date', Carbon::today($tz));
                    break;

                case 'yesterday':
                    $query->whereDate('purchase_date', Carbon::yesterday($tz));
                    break;

                case 'last_week':
                    $query->whereBetween('purchase_date', [
                        Carbon::now($tz)->subWeek()->startOfWeek(),
                        Carbon::now($tz)->subWeek()->endOfWeek(),
                    ]);
                    break;

                case 'last_month':
                    $query->whereBetween('purchase_date', [
                        Carbon::now($tz)->subMonth()->startOfMonth(),
                        Carbon::now($tz)->subMonth()->endOfMonth(),
                    ]);
                    break;

                case 'this_month':
                    $query->whereBetween('purchase_date', [
                        Carbon::now($tz)->startOfMonth(),
                        Carbon::now($tz)->endOfMonth(),
                    ]);
                    break;
            }
        }

        // ✅ CUSTOM DATE RANGE
        if ($request->preset === 'custom' && $request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('purchase_date', [
                Carbon::parse($request->from_date)->startOfDay(),
                Carbon::parse($request->to_date)->endOfDay(),
            ]);
        }

        $totalDue = (clone $query)->sum(DB::raw('(CAST(total_amount AS DECIMAL(10,2)) - CAST(paid_amount AS DECIMAL(10,2)))'));

        $purchases = $query->paginate(10)->withQueryString();

        return Inertia::render('account_payable/index', [
            'purchases' => $purchases,
            'totalDue' => $totalDue,
            'filters' => $request->only(['preset', 'from_date', 'to_date']),
            'settings' => $settings,
        ]);
    }

    public function update(Request $request, $id)
    {
        $purchase = Purchase::findOrFail($id);

        $request->validate([
            'paid_amount' => 'required|numeric|min:0',
            'due_amount' => 'required|numeric|min:0',
            'purchase_status' => 'required|string',
            'purchase_method' => 'required|string',
            'paid_date' => 'required|date',
        ]);

        $purchase->update([
            'paid_amount' => $request->paid_amount,
            'due_amount' => $request->due_amount,
            'purchase_status' => $request->purchase_status,
            'purchase_method' => $request->purchase_method,
            'paid_date' => $request->paid_date,
        ]);

        return response()->json([
            'success' => true,
        ]);
    }
}
