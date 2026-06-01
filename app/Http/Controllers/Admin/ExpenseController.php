<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Mpdf\Mpdf;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $query = Expense::with('user')->latest();

        if ($request->filled('preset') && $request->preset !== 'custom' && $request->preset !== 'all') {
            $preset = $request->preset;
            $tz = 'Asia/Phnom_Penh';

            if ($preset === 'today') {
                $query->whereDate('expense_date', Carbon::today($tz));
            } elseif ($preset === 'yesterday') {
                $query->whereDate('expense_date', Carbon::yesterday($tz));
            } elseif ($preset === 'last_week') {
                $query->whereBetween('expense_date', [
                    Carbon::today($tz)->subWeek()->startOfWeek(),
                    Carbon::today($tz)->subWeek()->endOfWeek(),
                ]);
            } elseif ($preset === 'last_month') {
                $query->whereBetween('expense_date', [
                    Carbon::today($tz)->subMonth()->startOfMonth(),
                    Carbon::today($tz)->subMonth()->endOfMonth(),
                ]);
            } elseif ($preset === 'this_month') {
                $query->whereBetween('expense_date', [
                    Carbon::today($tz)->startOfMonth(),
                    Carbon::today($tz)->endOfMonth(),
                ]);
            }
        } else {
            if ($request->filled('from_date')) {
                $query->whereDate('expense_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('expense_date', '<=', $request->to_date);
            }
        }

        // 1. Paginate the query and keep search filters in the pagination links
        $paginatedExpenses = $query->paginate(10)->withQueryString();

        // $expenses = $query->get()->map(function ($expense) {
        //     return [
        //         'id' => $expense->id,
        //         'user_name' => $expense->user->name,
        //         'expense_date' => $expense->expense_date,
        //         'expense_name' => $expense->expense_name,
        //         'description' => $expense->description,
        //         'expense_amount' => $expense->expense_amount,
        //         'created_at' => $expense->created_at->format('d-m-Y'),
        //         'status' => $expense->status,
        //     ];
        // });

        // 2. Use ->through() to transform the records without losing pagination metadata
        $expenses = $paginatedExpenses->through(function ($expense) {
            return [
                'id' => $expense->id,
                'user_name' => $expense->user->name ?? 'N/A', // Added null fallback protection
                'expense_date' => $expense->expense_date,
                'expense_name' => $expense->expense_name,
                'description' => $expense->description,
                'expense_amount' => $expense->expense_amount,
                'created_at' => $expense->created_at ? $expense->created_at->format('d-m-Y') : '',
                'status' => $expense->status,
                'unit' => $expense->unit,
                'expense_method' => $expense->expense_method,
                'due_amount' => $expense->due_amount,
            ];
        });

        return Inertia::render('expense/index', [
            'expenses' => $expenses,
            'settings' => $settings,
            'filters' => $request->only(['from_date', 'to_date', 'preset']),
        ]);
    }

    public function export(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'] ?? '$';
        $query = Expense::with('user')->latest();

        if ($request->filled('preset') && $request->preset !== 'custom' && $request->preset !== 'all') {
            $preset = $request->preset;
            $tz = 'Asia/Phnom_Penh';

            if ($preset === 'today') {
                $query->whereDate('expense_date', Carbon::today($tz));
            } elseif ($preset === 'yesterday') {
                $query->whereDate('expense_date', Carbon::yesterday($tz));
            } elseif ($preset === 'last_week') {
                $query->whereBetween('expense_date', [
                    Carbon::today($tz)->subWeek()->startOfWeek(),
                    Carbon::today($tz)->subWeek()->endOfWeek(),
                ]);
            } elseif ($preset === 'last_month') {
                $query->whereBetween('expense_date', [
                    Carbon::today($tz)->subMonth()->startOfMonth(),
                    Carbon::today($tz)->subMonth()->endOfMonth(),
                ]);
            } elseif ($preset === 'this_month') {
                $query->whereBetween('expense_date', [
                    Carbon::today($tz)->startOfMonth(),
                    Carbon::today($tz)->endOfMonth(),
                ]);
            }
        } else {
            if ($request->filled('from_date')) {
                $query->whereDate('expense_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('expense_date', '<=', $request->to_date);
            }
        }

        $expenses = $query->get();

        if ($request->query('format') === 'excel') {
            $headers = [
                'Content-type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename=expenses_'.date('Ymd_His').'.csv',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            $callback = function () use ($expenses, $currency) {

                if (ob_get_level() > 0) {
                    ob_end_clean();
                }
                $file = fopen('php://output', 'w');
                // Add BOM for Excel UTF-8 support
                fwrite($file, $bom = (chr(0xEF).chr(0xBB).chr(0xBF)));
                fputcsv($file, ['ID', 'Date', 'Expense Name', 'Amount ('.$currency.')', 'Status', 'User', 'Description']);

                foreach ($expenses as $expense) {
                    fputcsv($file, [
                        $expense->id,
                        $expense->expense_date,
                        $expense->expense_name,
                        $expense->expense_amount,
                        $expense->status,
                        $expense->user->name ?? '',
                        $expense->description,
                    ]);
                }
                fclose($file);
            };

            return Response::stream($callback, 200, $headers);
        }

        if ($request->query('format') === 'pdf') {
            $html = '<h2 style="text-align: center;">Expenses Report</h2>';
            $html .= '<table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px;">';
            $html .= '<tr style="background-color: #f2f2f2;"><th>ID</th><th>Date</th><th>Expense Name</th><th>Amount</th><th>Status</th><th>User</th></tr>';

            $totalAmount = 0;
            foreach ($expenses as $expense) {
                $totalAmount += $expense->expense_amount;
                $html .= '<tr>';
                $html .= '<td>'.$expense->id.'</td>';
                $html .= '<td>'.$expense->expense_date.'</td>';
                $html .= '<td>'.$expense->expense_name.'</td>';
                $html .= '<td style="text-align: right;">'.$currency.number_format($expense->expense_amount, 2).'</td>';
                $html .= '<td><span style="text-transform: uppercase;">'.$expense->status.'</span></td>';
                $html .= '<td>'.($expense->user->name ?? '').'</td>';
                $html .= '</tr>';
            }

            $html .= '<tr><td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>';
            $html .= '<td style="text-align: right; font-weight: bold;">'.$currency.number_format($totalAmount, 2).'</td>';
            $html .= '<td colspan="2"></td></tr>';

            $html .= '</table>';

            $mpdf = new Mpdf([
                'tempDir' => storage_path('app/temp'),
                'autoScriptToLang' => true,
                'autoLangToFont' => true,
            ]);
            $mpdf->WriteHTML($html);

            return response()->streamDownload(function () use ($mpdf) {
                echo $mpdf->Output('', 'S');
            }, 'expenses_'.date('Ymd_His').'.pdf');

        }

        return back();
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
            'expense_name' => 'required',
            'expense_date' => 'required',
            'expense_amount' => 'required',
            'description' => 'nullable',
            'status' => 'required',
            'unit' => 'nullable',
            'expense_method' => 'required',
            'due_amount' => 'required_if:expense_method,due',
        ], [
            'expense_name.required' => 'Expense amount is required',
            'expense_date.required' => 'Expense Date is required',
            'expense_amount.required' => 'Expense Amount is required',
            'status' => 'Expense Status is required',
        ]);

        if ($validated['expense_method'] === 'due') {
            $dueAmount = $validated['expense_amount'];
        }
        $expense = Expense::create([
            'user_id' => auth()->id(),
            'expense_name' => $validated['expense_name'],
            'expense_date' => $validated['expense_date'],
            'expense_amount' => $validated['expense_amount'],
            'description' => $validated['description'],
            'status' => $validated['status'],
            'unit' => $validated['unit'],
            'expense_method' => $validated['expense_method'],
            'due_amount' => $validated['expense_method'] === 'due' ? $dueAmount : 0,
        ]);

        return redirect()->route('expense.index')->with('success', 'Expense created successfully');
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
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'expense_name' => 'required',
            'expense_date' => 'required',
            'expense_amount' => 'required',
            'description' => 'nullable',
            'status' => 'required',
            'unit' => 'nullable',
            'expense_method' => 'required',
            'due_amount' => 'required_if:expense_method,due',
        ], [
            'expense_name.required' => 'Expense amount is required',
            'expense_date.required' => 'Expense Date is required',
            'expense_amount.required' => 'Expense Amount is required',
            'status' => 'Expense Status is required',
        ]);

        if ($validated['expense_method'] === 'due') {
            $dueAmount = $validated['expense_amount'];
        }

        if ($validated['expense_method'] === 'paid') {
            $dueAmount = $expense->expense_amount - $validated['expense_amount'];
        }

        $expense = Expense::findOrFail($id)->update([
            'user_id' => auth()->id(),
            'expense_name' => $validated['expense_name'],
            'expense_date' => $validated['expense_date'],
            'expense_amount' => $validated['expense_amount'],
            'description' => $validated['description'],
            'status' => $validated['status'],
            'unit' => $validated['unit'],
            'expense_method' => $validated['expense_method'],
            'due_amount' => $dueAmount,
        ]);

        return redirect()->route('expense.index')->with('success', 'Expense updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $expense = Expense::findOrFail($id)->delete();

        return redirect()->route('expense.index')->with('success', 'Expense deleted successfully');
    }
}
