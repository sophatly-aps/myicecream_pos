<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\PurchaseHistoryController;

Route::get('/purchase/{id}', [PurchaseHistoryController::class, 'show']);