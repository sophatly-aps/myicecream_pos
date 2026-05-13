<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');
        $users = User::select('id', 'name', 'email', 'role', 'created_at')->latest()->get();

        return Inertia::render('settings/company_info', [
            'settings' => $settings,
            'users'    => $users,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'            => 'nullable|string|max:255',
            'phone'           => 'nullable|string|max:50',
            'address'         => 'nullable|string|max:500',
            'email'           => 'nullable|email|max:255',
            'currency_symbol' => 'nullable|string|max:10',
            'logo'            => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $fields = ['name', 'phone', 'address', 'email', 'currency_symbol'];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::updateOrCreate(['key' => $field], ['value' => $request->input($field)]);
            }
        }

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('company', 'public');
            Setting::updateOrCreate(['key' => 'logo'], ['value' => $path]);
        }

        return back()->with('success', 'Settings saved successfully!');
    }
}
