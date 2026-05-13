<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\Order;
use App\Models\Purchase;
use App\Models\Expense;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class IncomeStatementController extends Controller
{
    private function applyFilters($query, Request $request, $dateColumn)
    {
        if ($request->filled('preset') && $request->preset !== 'custom' && $request->preset !== 'all') {
            $preset = $request->preset;
            $tz = 'Asia/Phnom_Penh';
            
            if ($preset === 'today') {
                $query->whereDate($dateColumn, Carbon::today($tz));
            } elseif ($preset === 'yesterday') {
                $query->whereDate($dateColumn, Carbon::yesterday($tz));
            } elseif ($preset === 'last_week') {
                $query->whereBetween($dateColumn, [
                    Carbon::today($tz)->subWeek()->startOfWeek(),
                    Carbon::today($tz)->subWeek()->endOfWeek()
                ]);
            } elseif ($preset === 'last_month') {
                $query->whereBetween($dateColumn, [
                    Carbon::today($tz)->subMonth()->startOfMonth(),
                    Carbon::today($tz)->subMonth()->endOfMonth()
                ]);
            } elseif ($preset === 'this_month') {
                $query->whereBetween($dateColumn, [
                    Carbon::today($tz)->startOfMonth(),
                    Carbon::today($tz)->endOfMonth()
                ]);
            }
        } else {
            if ($request->filled('from_date')) {
                $query->whereDate($dateColumn, '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate($dateColumn, '<=', $request->to_date);
            }
        }
        
        return $query;
    }

    private function getIncomeStatementData(Request $request)
    {
        // Total Sales
        $salesQuery = Order::query();
        $salesQuery = $this->applyFilters($salesQuery, $request, 'order_date');
        
        $totalSales = (float) $salesQuery->sum('total_amount');
        $collectedSales = (float) $salesQuery->sum('paid_amount');
        $accountsReceivable = $totalSales - $collectedSales;

        // Cost of Goods Sold (COGS) based on sold products' base_price
        $cogsQuery = \App\Models\OrderDetail::join('orders', 'order_details.order_id', '=', 'orders.id')
            ->join('products', 'order_details.product_id', '=', 'products.id');
        $cogsQuery = $this->applyFilters($cogsQuery, $request, 'orders.order_date');
        $cogs = (float) $cogsQuery->sum(DB::raw('order_details.quantity * products.base_price'));

        // Gross Profit
        $grossProfit = $totalSales - $cogs;

        // Operating Expenses
        $expensesQuery = Expense::query();
        $expensesQuery = $this->applyFilters($expensesQuery, $request, 'expense_date');
        $totalExpenses = (float) $expensesQuery->sum('expense_amount');

        // Net Income
        $netIncome = $grossProfit - $totalExpenses;

        // Expenses Breakdown
        $expensesBreakdownQuery = Expense::select('expense_name', DB::raw('SUM(expense_amount) as total_amount'))
                                         ->groupBy('expense_name')
                                         ->orderBy('total_amount', 'desc');
        $expensesBreakdownQuery = $this->applyFilters($expensesBreakdownQuery, $request, 'expense_date');
        $expensesBreakdown = $expensesBreakdownQuery->get();

        return compact('totalSales', 'collectedSales', 'accountsReceivable', 'cogs', 'grossProfit', 'totalExpenses', 'netIncome', 'expensesBreakdown');
    }

    public function index(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $data = $this->getIncomeStatementData($request);

        return Inertia::render('income_statement/index', [
            'data' => $data,
            'settings' => $settings,
            'filters' => $request->only(['from_date', 'to_date', 'preset']),
        ]);
    }

    public function export(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'] ?? '$';
        $data = $this->getIncomeStatementData($request);

        if ($request->query('format') === 'excel') {
            $headers = [
                "Content-type"        => "text/csv; charset=UTF-8",
                "Content-Disposition" => "attachment; filename=income_statement_" . date('Ymd_His') . ".csv",
                "Pragma"              => "no-cache",
                "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
                "Expires"             => "0"
            ];
            
            $callback = function() use($data, $currency) {
                $file = fopen('php://output', 'w');
                fputs($file, $bom =(chr(0xEF) . chr(0xBB) . chr(0xBF)));
                
                fputcsv($file, ['Income Statement']);
                fputcsv($file, ['']);
                
                fputcsv($file, ['Revenue']);
                fputcsv($file, ['Total Sales', $currency . number_format($data['totalSales'], 2)]);
                fputcsv($file, ['Collected Sales', $currency . number_format($data['collectedSales'], 2)]);
                fputcsv($file, ['Accounts Receivable (Due)', $currency . number_format($data['accountsReceivable'], 2)]);
                fputcsv($file, ['']);
                
                fputcsv($file, ['Cost of Goods Sold (COGS)']);
                fputcsv($file, ['Cost of Goods Sold', $currency . number_format($data['cogs'], 2)]);
                fputcsv($file, ['']);
                
                fputcsv($file, ['Gross Profit', $currency . number_format($data['grossProfit'], 2)]);
                fputcsv($file, ['']);
                
                fputcsv($file, ['Operating Expenses']);
                foreach ($data['expensesBreakdown'] as $expense) {
                    fputcsv($file, [$expense->expense_name, $currency . number_format($expense->total_amount, 2)]);
                }
                fputcsv($file, ['Total Expenses', $currency . number_format($data['totalExpenses'], 2)]);
                fputcsv($file, ['']);
                
                fputcsv($file, ['Net Income', $currency . number_format($data['netIncome'], 2)]);
                
                fclose($file);
            };
            
            return \Illuminate\Support\Facades\Response::stream($callback, 200, $headers);
        }

        if ($request->query('format') === 'pdf') {
            $html = '<h2 style="text-align: center;">Income Statement</h2>';
            
            // Add date range info if exists
            $dateInfo = "All Time";
            if ($request->preset && $request->preset !== 'all' && $request->preset !== 'custom') {
                $dateInfo = ucwords(str_replace('_', ' ', $request->preset));
            } else if ($request->preset === 'custom') {
                $dateInfo = ($request->from_date ?? 'Beginning') . ' to ' . ($request->to_date ?? 'Today');
            }
            $html .= '<p style="text-align: center; color: #555;">Period: ' . $dateInfo . '</p>';
            
            $html .= '<table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px;">';
            
            // Revenue
            $html .= '<tr style="background-color: #f2f2f2;"><th colspan="2" style="text-align: left;">Revenue</th></tr>';
            $html .= '<tr><td>Total Sales</td><td style="text-align: right;">' . $currency . number_format($data['totalSales'], 2) . '</td></tr>';
            $html .= '<tr><td>Collected Sales</td><td style="text-align: right;">' . $currency . number_format($data['collectedSales'], 2) . '</td></tr>';
            $html .= '<tr><td>Accounts Receivable (Due)</td><td style="text-align: right;">' . $currency . number_format($data['accountsReceivable'], 2) . '</td></tr>';
            
            // COGS
            $html .= '<tr style="background-color: #f2f2f2;"><th colspan="2" style="text-align: left;">Cost of Goods Sold</th></tr>';
            $html .= '<tr><td>Cost of Goods Sold</td><td style="text-align: right;">' . $currency . number_format($data['cogs'], 2) . '</td></tr>';
            
            // Gross Profit
            $html .= '<tr><td style="font-weight: bold;">Gross Profit</td><td style="text-align: right; font-weight: bold;">' . $currency . number_format($data['grossProfit'], 2) . '</td></tr>';
            
            // Operating Expenses
            $html .= '<tr style="background-color: #f2f2f2;"><th colspan="2" style="text-align: left;">Operating Expenses</th></tr>';
            foreach ($data['expensesBreakdown'] as $expense) {
                $html .= '<tr><td style="padding-left: 20px;">' . $expense->expense_name . '</td><td style="text-align: right;">' . $currency . number_format($expense->total_amount, 2) . '</td></tr>';
            }
            $html .= '<tr><td style="font-weight: bold;">Total Operating Expenses</td><td style="text-align: right; font-weight: bold;">' . $currency . number_format($data['totalExpenses'], 2) . '</td></tr>';
            
            // Net Income
            $netIncomeColor = $data['netIncome'] >= 0 ? '#15803d' : '#b91c1c';
            $html .= '<tr><td style="font-weight: bold; font-size: 14px; border-top: 2px solid #000;">Net Income</td><td style="text-align: right; font-weight: bold; font-size: 14px; border-top: 2px solid #000; color: ' . $netIncomeColor . ';">' . $currency . number_format($data['netIncome'], 2) . '</td></tr>';
            
            $html .= '</table>';

            $mpdf = new \Mpdf\Mpdf([
                'tempDir' => storage_path('app/temp'),
                'autoScriptToLang' => true,
                'autoLangToFont'   => true,
            ]);
            $mpdf->WriteHTML($html);
            return response()->streamDownload(function () use ($mpdf) {
                echo $mpdf->Output('', 'S');
            }, 'income_statement_' . date('Ymd_His') . '.pdf');
        }

        return back();
    }
}
