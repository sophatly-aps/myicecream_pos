<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'parent_id',
        'name',
        'phone',
        'address',
        'other_info',
        'status',
    ];

    public function parent()
    {
        return $this->belongsTo(Customer::class, 'parent_id');
    }

    public function subCustomers()
    {
        return $this->hasMany(Customer::class, 'parent_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
