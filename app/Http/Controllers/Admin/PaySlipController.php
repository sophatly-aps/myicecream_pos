<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdvanceSalary;
use App\Models\Employee;
use App\Models\Payslip;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class PaySlipController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Payslip::with('employee')->latest();

        if ($request->filled('filter_month')) {
            $query->where('month', $request->filter_month);
        }

        $payslips = $query->paginate(10);
        $employees = Employee::all();
        $settings = Setting::pluck('value', 'key')->toArray();
        $company_name = $settings['name'] ?? 'Company Name';
        $currency = $settings['currency_symbol'] ?? '$';

        return inertia('employees/pay_slip/index', [
            'payslips' => $payslips,
            'employees' => $employees,
            'settings' => $settings,
            'company_name' => $company_name,
            'currency' => $currency,
            'filters' => $request->only(['filter_month']),
        ]);
    }

    public function export(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'] ?? '$';
        $query = Payslip::with('employee')->latest();

        if ($request->filled('filter_month')) {
            $query->where('month', $request->filter_month);
        }

        $payslips = $query->get();

        if ($request->query('format') === 'excel') {
            $headers = [
                'Content-type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename=payslips_'.date('Ymd_His').'.csv',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            $callback = function () use ($payslips, $currency) {
                if (ob_get_level() > 0) {
                    ob_end_clean();
                }
                $file = fopen('php://output', 'w');
                // Add BOM for Excel UTF-8 support
                fwrite($file, $bom = (chr(0xEF).chr(0xBB).chr(0xBF)));
                fputcsv($file, [
                    'ID',
                    'Employee Name',
                    'Month',
                    'Base Salary ('.$currency.')',
                    'Advance Deductions ('.$currency.')',
                    'Other Deductions ('.$currency.')',
                    'Net Salary ('.$currency.')',
                    'Status',
                ]);

                foreach ($payslips as $payslip) {
                    fputcsv($file, [
                        $payslip->id,
                        $payslip->employee->name ?? '',
                        $payslip->month,
                        $payslip->base_salary,
                        $payslip->total_advance,
                        $payslip->other_deductions,
                        $payslip->net_salary,
                        $payslip->status,
                    ]);
                }
                fclose($file);
            };

            return Response::stream($callback, 200, $headers);
        }

        return back();
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $employee_id = $request->query('employee_id');
        $month = $request->query('month', now()->format('Y-m'));
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'];

        if (! $employee_id) {
            return redirect()->route('employees.index')->with('error', 'Please select an employee first.');
        }

        $employee = Employee::findOrFail($employee_id);

        // Sum all APPROVED advance salaries for this employee in this month
        $totalAdvance = AdvanceSalary::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('request_date', 'like', $month.'%')
            ->sum('amount');

        return inertia('employees/pay_slip/create', [
            'employee' => $employee,
            'month' => $month,
            'total_advance' => $totalAdvance,
            'base_salary' => $employee->salary,
            'net_salary' => $employee->salary - $totalAdvance,
            'currency' => $currency,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|string',
            'base_salary' => 'required|numeric',
            'advance_deduction' => 'required|numeric',
            'other_deduction' => 'required|numeric',
            'net_salary' => 'required|numeric',
        ]);

        // Check if payslip already exists
        $exists = Payslip::where('employee_id', $request->employee_id)
            ->where('month', $request->month)
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', 'Payslip for this month already exists for this employee.');
        }

        Payslip::create([
            'employee_id' => $request->employee_id,
            'month' => $request->month,
            'base_salary' => $request->base_salary,
            'total_advance' => $request->advance_deduction,
            'other_deductions' => $request->other_deduction,
            'net_salary' => $request->net_salary,
            'status' => 'paid',
        ]);

        return redirect()->route('payslips.index')->with('success', 'Payslip created successfully.');
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
        $payslip = Payslip::with('employee')->findOrFail($id);

        return inertia('employees/pay_slip/edit', [
            'payslip' => $payslip,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $payslip = Payslip::findOrFail($id);

        $request->validate([
            'base_salary' => 'required|numeric',
            'advance_deduction' => 'required|numeric',
            'other_deduction' => 'required|numeric',
            'net_salary' => 'required|numeric',
            'status' => 'required|string',
        ]);

        $payslip->update([
            'base_salary' => $request->base_salary,
            'total_advance' => $request->advance_deduction,
            'other_deductions' => $request->other_deduction,
            'net_salary' => $request->net_salary,
            'status' => $request->status,
        ]);

        return redirect()->route('payslips.index')->with('success', 'Payslip updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $payslip = Payslip::findOrFail($id);
        $payslip->delete();

        return redirect()->route('payslips.index')->with('success', 'Payslip deleted successfully.');
    }
}
