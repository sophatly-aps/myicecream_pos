<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['name', 'position', 'phone', 'address', 'salary', 'image', 'date_hire', 'yearly_bonus'];

    public function absences()
    {
        return $this->hasMany(EmployeeAbsence::class);
    }
}
