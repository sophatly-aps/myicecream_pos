<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Display a listing of the permissions.
     */
    public function index()
    {
        return Inertia::render('permissions/index', [
            'permissions' => Permission::all(),
        ]);
    }

    /**
     * Store a newly created permission in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:permissions,name',
        ]);

        Permission::create([
            'name' => $request->name,
            'guard_name' => 'web', // typically defaults to web, but explicitly set
        ]);

        return back()->with('success', 'Permission created');
    }

    /**
     * Update the specified permission in storage.
     */
    public function update(Request $request, string $id)
    {
        $permission = Permission::findOrFail($id);

        $request->validate([
            'name' => 'required|string|unique:permissions,name,' . $permission->id,
        ]);

        $permission->update([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Permission updated');
    }

    /**
     * Remove the specified permission from storage.
     */
    public function destroy(string $id)
    {
        Permission::findOrFail($id)->delete();

        return back()->with('success', 'Permission deleted');
    }
}
