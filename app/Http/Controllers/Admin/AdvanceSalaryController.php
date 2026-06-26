<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdvanceSalary;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdvanceSalaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $query = AdvanceSalary::with('employee');

        if ($request->filled('search')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%');
            });
        }

        $advanceSalaries = $query->latest()->paginate(10)->through(function ($item) {
            return [
                'id' => $item->id,
                'employee_id' => $item->employee_id,
                'employee_name' => $item->employee->name ?? 'N/A',
                'request_date' => $item->request_date ? Carbon::parse($item->request_date)->format('d-m-Y') : null,
                'amount' => $item->amount,
                'reason' => $item->reason,
                'status' => $item->status,
            ];
        });

        return Inertia::render('employees/advance_salary/index', [
            'advance_salaries' => $advanceSalaries,
            'filters' => $request->only('search'),
            'employees' => Employee::select('id', 'name')->get(),
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
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'request_date' => 'required|date',
            'amount' => 'required|numeric',
            'status' => 'required',
            'reason' => 'nullable|string',
        ]);

        AdvanceSalary::create([
            'employee_id' => $request->employee_id,
            'request_date' => $request->request_date,
            'amount' => $request->amount,
            'status' => $request->status,
            'reason' => $request->reason,
        ]);

        return redirect()->route('advance-salary.index')
            ->with('success', __('Advance Salary created successfully.'));
    }

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
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'request_date' => 'required|date',
            'amount' => 'required|numeric',
            'status' => 'required',
            'reason' => 'nullable|string',
        ]);

        $advanceSalary = AdvanceSalary::findOrFail($id);

        $advanceSalary->update([
            'employee_id' => $request->employee_id,
            'request_date' => $request->request_date,
            'amount' => $request->amount,
            'status' => $request->status,
            'reason' => $request->reason,
        ]);

        return redirect()->route('advance-salary.index')
            ->with('success', __('Advance Salary updated successfully.'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $advanceSalary = AdvanceSalary::findOrFail($id);
        $advanceSalary->delete();

        return redirect()->route('advance-salary.index')
            ->with('success', __('Advance Salary deleted successfully.'));
    }
}
