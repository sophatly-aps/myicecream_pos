<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeAbsence;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeAbsenceController extends Controller
{
    public function index(Request $request)
    {
        $query = EmployeeAbsence::with('employee');

        if ($request->filled('search')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%');
            });
        }

        $absences = $query->latest()->paginate(10)->through(function ($item) {
            return [
                'id' => $item->id,
                'employee_id' => $item->employee_id,
                'employee_name' => $item->employee->name ?? 'N/A',
                'month' => $item->month,
                'absent_days' => $item->absent_days,
                'reason' => $item->reason,
            ];
        });

        return Inertia::render('employees/absences/index', [
            'absences' => $absences,
            'filters' => $request->only('search'),
            'employees' => Employee::select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|string|size:7', // YYYY-MM
            'absent_days' => 'required|integer|min:0|max:31',
            'reason' => 'nullable:string',
        ]);

        EmployeeAbsence::updateOrCreate(
            ['employee_id' => $request->employee_id, 'month' => $request->month, 'reason' => $request->reason],
            ['absent_days' => $request->absent_days],
        );

        return redirect()->route('absences.index')
            ->with('success', __('Employee Absence created successfully.'));
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|string|size:7', // YYYY-MM
            'absent_days' => 'required|integer|min:0|max:31',
            'reason' => 'nullable:string',
        ]);

        $absence = EmployeeAbsence::findOrFail($id);
        $absence->update([
            'employee_id' => $request->employee_id,
            'month' => $request->month,
            'absent_days' => $request->absent_days,
            'reason' => $request->reason,
        ]);

        return redirect()->route('absences.index')
            ->with('success', __('Employee Absence updated successfully.'));
    }

    public function destroy(string $id)
    {
        $absence = EmployeeAbsence::findOrFail($id);
        $absence->delete();

        return redirect()->route('absences.index')
            ->with('success', __('Employee Absence deleted successfully.'));
    }
}
