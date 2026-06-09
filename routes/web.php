<?php

use App\Http\Controllers\Admin\AbsenceController;
use App\Http\Controllers\Admin\AccountReceivableController;
use App\Http\Controllers\Admin\AdvanceSalaryController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\IncomeStatementController;
use App\Http\Controllers\Admin\PaySlipController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\PurchaseController;
use App\Http\Controllers\Admin\PurchaseHistoryController;
use App\Http\Controllers\Admin\PurchaseItemController;
use App\Http\Controllers\Admin\ReceiptController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SaleController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\SaleDetailController;
use App\Models\Order;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

// Route::inertia('/', 'welcome', [
//     'canRegister' => Features::enabled(Features::registration()),
// ])->name('home');

// 1. Guest Landing (Redirect to Login)
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Exports
    Route::get('expense/export', [ExpenseController::class, 'export'])->name('expense.export');
    Route::get('income-statement/export', [IncomeStatementController::class, 'export'])->name('income.statement.export');
    Route::get('sales-history/export', [SaleDetailController::class, 'export'])->name('sales.history.export');
    Route::get('employees/export', [EmployeeController::class, 'export'])->name('employees.export');
    Route::get('payslips/export', [PaySlipController::class, 'export'])->name('payslips.export');

    Route::resources([
        'categories' => CategoryController::class,
        'products' => ProductController::class,
        'suppliers' => SupplierController::class,
        'customers' => CustomerController::class,
        'employees' => EmployeeController::class,
        'purchase-item' => PurchaseItemController::class,
        'purchase' => PurchaseController::class,
        'expense' => ExpenseController::class,
        'advance-salary' => AdvanceSalaryController::class,
        'payslips' => PaySlipController::class,
    ]);

    // Sales & Receipts
    Route::get('sales/receipt/{id}', [ReceiptController::class, 'receipt'])->name('sales.receipt');
    Route::get('sales/printHtml/{id}', [ReceiptController::class, 'printHtml'])->name('sales.printHtml');
    Route::get('sales-history', [SaleDetailController::class, 'index'])->name('sales.history');
    Route::get('test-restore/{id}', function ($id) {
        $order = Order::onlyTrashed()->findOrFail($id);
        $order->restore();
        $order->details()->restore();

        return 'ok';
    });
    Route::post('sales/{id}/restore', [SaleController::class, 'restore'])->name('sales.restore');
    Route::delete('sales/{id}/force', [SaleController::class, 'forceDelete'])->name('sales.forceDelete');
    Route::resource('sales', SaleController::class);

    // Purchase History routes

    Route::get('/purchase-data', [PurchaseHistoryController::class, 'data'])->name('purchase-data');
    Route::get('/purchase/{id}', [PurchaseHistoryController::class, 'show'])
        ->name('purchase.show');
    Route::delete('/purchase-history/{id}', [PurchaseHistoryController::class, 'destroy'])
        ->name('purchase-history-page.destroy');
    Route::post('/purchase-history/{id}/restore', [PurchaseHistoryController::class, 'restore'])
        ->name('purchase-history.restore');

    Route::delete('/purchase-history/{id}/force', [PurchaseHistoryController::class, 'forceDelete'])
        ->name('purchase-history.force');

    Route::resource('purchase-history', PurchaseHistoryController::class);

    Route::get('income-statement', [IncomeStatementController::class, 'index'])->name('income.statement.index');
    Route::get('account-receivable', [AccountReceivableController::class, 'index'])->name('account.receivable.index');

    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.delete');
    Route::put('/users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');
    Route::delete('/users/{id}/force', [UserController::class, 'forceDelete'])->name('users.forceDelete');

    Route::middleware(['permission:users.view'])->get('/users', [UserController::class, 'index'])->name('users.index');

    Route::middleware(['permission:users.create'])->get('/users/create', [UserController::class, 'create']);
    Route::middleware(['permission:users.create'])->post('/users', [UserController::class, 'store'])->name('users.store');

    Route::middleware(['permission:users.edit'])->get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::middleware(['permission:users.edit'])->put('/users/{user}', [UserController::class, 'update'])->name('users.permission.update');

    Route::middleware(['permission:users.delete'])->delete('/users/{user}', [UserController::class, 'destroy'])->name('users.permission.delete');

    Route::middleware(['permission:roles.view'])->get('/roles', [RoleController::class, 'index']);
    Route::middleware(['permission:roles.create'])->post('/roles', [RoleController::class, 'store']);
    Route::middleware(['permission:roles.edit'])->put('/roles/{role}', [RoleController::class, 'update']);
    Route::middleware(['permission:roles.delete'])->delete('/roles/{role}', [RoleController::class, 'destroy']);

    Route::middleware(['permission:permissions.view'])->get('/permissions', [PermissionController::class, 'index']);
    Route::middleware(['permission:permissions.create'])->post('/permissions', [PermissionController::class, 'store']);
    Route::middleware(['permission:permissions.edit'])->put('/permissions/{permission}', [PermissionController::class, 'update']);
    Route::middleware(['permission:permissions.delete'])->delete('/permissions/{permission}', [PermissionController::class, 'destroy']);

    // Only admins can access user management
    Route::middleware(['role:admin'])->group(function () {
        // Users Extra Actions
        Route::put('users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');
        Route::delete('users/{id}/force', [UserController::class, 'forceDelete'])->name('users.forceDelete');

        // Resources (Automatically creates users.index, users.update, etc.)
        Route::resource('users', UserController::class);
        Route::resource('roles', RoleController::class);
        Route::resource('permissions', PermissionController::class);
    });

    Route::get('/absence', [AbsenceController::class, 'index'])->name('absence.index');

    Route::get('settings-info', [SettingController::class, 'index'])->name('settings.index');
    Route::post('settings-info', [SettingController::class, 'store'])->name('settings.store');

    Route::get('language/{locale}', function ($locale) {
        if (in_array($locale, ['en', 'km'])) {
            session()->put('locale', $locale);
        }

        return redirect()->back();
    })->name('language.switch');
});

require __DIR__.'/settings.php';
require __DIR__.'/api.php';
