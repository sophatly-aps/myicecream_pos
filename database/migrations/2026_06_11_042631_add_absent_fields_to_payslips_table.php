<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            if (!Schema::hasColumn('payslips', 'absent_days')) {
                $table->integer('absent_days')->default(0)->after('net_salary');
            }
            if (!Schema::hasColumn('payslips', 'absent_deduction')) {
                $table->decimal('absent_deduction', 10, 2)->default(0.00)->after('absent_days');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['absent_days', 'absent_deduction']);
        });
    }
};
