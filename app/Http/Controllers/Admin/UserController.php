<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('users/index', [
            'users' => User::with('roles')->get(),
            'availableRoles' => \Spatie\Permission\Models\Role::all()->pluck('name'),
        ]);
    }

    public function store(Request $request)
    {
        // ✅ VALIDATION
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => $request->isMethod('post')
                ? 'required|min:6|confirmed'
                : 'nullable|min:6|confirmed',
            'role' => 'required|string',
            'status' => 'required|in:active,inactive',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // ✅ CREATE USER
        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = Hash::make($validated['password']);
        $user->role = $validated['role'];
        $user->status = $validated['status'];

        // ✅ HANDLE PHOTO UPLOAD
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('users', 'public');
            $user->photo = $path;
        }

        $user->save();

        // ✅ ASSIGN SPATie ROLE
        if ($request->role) {
            $user->assignRole($request->role);
        }

        return redirect()->back()->with('success', 'User created successfully!');
    }

    public function update(Request $request, string $id)
    {
      $user = User::findOrFail($id);

       // ✅ VALIDATION
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:6|confirmed',
            'role' => 'required|string',
            'status' => 'required|in:active,inactive',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->status = $validated['status'];

        // ✅ PHOTO UPDATE (replace old file)
        if ($request->hasFile('photo')) {
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }

            // ✅ Upload new photo
            $path = $request->file('photo')->store('users', 'public');
            $user->photo = $path;
        }

        // Sync the role with Spatie
        $user->syncRoles($request->role);

        $user->save();

        return redirect()->back()->with('success', 'User updated successfully!');
    }

    public function destroy(string $id)
    {
       $user = User::findOrFail($id);
        // ❌ Prevent deleting admin
       if ($user->role === 'admin') {
            return back()->withErrors([
                'error' => 'Admin users cannot be deleted.'
            ]);
        }

       $user->delete(); // soft delete

       return back()->with('success', 'User moved to trash!');
    }

    public function restore($id)
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return back()->with('success', 'User restored successfully!');
    }

    public function forceDelete($id)
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->forceDelete();

        return back()->with('success', 'User permanently deleted!');
    }
}
