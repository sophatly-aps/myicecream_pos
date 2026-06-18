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
        Schema::table('employee_absences', function (Blueprint $table) {
            $table->dropColumn(['absent_date', 'deduction_amount', 'reason']);
            $table->string('month', 7); // e.g. YYYY-MM
            $table->integer('absent_days')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_absences', function (Blueprint $table) {
            $table->date('absent_date')->nullable();
            $table->decimal('deduction_amount', 10, 2)->default(0.00);
            $table->text('reason')->nullable();
            $table->dropColumn(['month', 'absent_days']);
        });
    }
};
