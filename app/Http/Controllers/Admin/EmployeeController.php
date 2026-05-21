<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $employees = Employee::latest()->paginate(15);

        return Inertia::render('employees/index', [
            'employees' => $employees,
            'settings' => $settings,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'salary' => 'nullable|numeric|min:0',
            'date_hire' => 'nullable|date',
            'yearly_bonus' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->only(['name', 'position', 'phone', 'address', 'salary', 'date_hire', 'yearly_bonus']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('employees', 'public');
        }

        Employee::create($data);

        return back()->with('success', 'Employee created successfully!');
    }

    public function update(Request $request, string $id)
    {
        $employee = Employee::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'salary' => 'nullable|numeric|min:0',
            'date_hire' => 'nullable|date',
            'yearly_bonus' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->only(['name', 'position', 'phone', 'address', 'salary', 'date_hire', 'yearly_bonus']);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($employee->image) {
                Storage::disk('public')->delete($employee->image);
            }
            $data['image'] = $request->file('image')->store('employees', 'public');
        }

        $employee->update($data);

        return back()->with('success', 'Employee updated successfully!');
    }

    public function destroy(string $id)
    {
        $employee = Employee::findOrFail($id);

        if ($employee->image) {
            Storage::disk('public')->delete($employee->image);
        }

        $employee->delete();

        return back()->with('success', 'Employee deleted successfully!');
    }

    public function export(Request $request)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'] ?? '$';
        $employees = Employee::all();

        if ($request->query('format') === 'excel') {
            $headers = [
                'Content-type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename=employees_'.date('Ymd_His').'.csv',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];
            $callback = function () use ($employees) {

                if (ob_get_level() > 0) {
                    ob_end_clean();
                }
                $file = fopen('php://output', 'w');
                // Add BOM for Excel UTF-8 support
                fwrite($file, $bom = (chr(0xEF).chr(0xBB).chr(0xBF)));
                fputcsv($file, ['ID', 'Name', 'Position', 'Phone', 'Address', 'Salary']);

                foreach ($employees as $employee) {
                    fputcsv($file, [
                        $employee->id,
                        $employee->name,
                        $employee->position,
                        $employee->phone,
                        $employee->address,
                        $employee->salary,
                    ]);
                }
                fclose($file);
            };

            return Response::stream($callback, 200, $headers);
        }

        return back();
    }
}
