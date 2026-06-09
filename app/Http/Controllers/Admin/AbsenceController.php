<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeAbsence;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AbsenceController extends Controller
{
    public function index(Request $request)
    {
        $absences = EmployeeAbsence::with('employee')
            ->orderBy('absent_date', 'desc')
            ->paginate(10);

        $employees = Employee::where('status', 'active')->get(['id', 'name', 'base_salary']);

        return Inertia::render('employees/absence/index', [
            'absences' => $absences,
            'employees' => $employees,
        ]);
    }
}
