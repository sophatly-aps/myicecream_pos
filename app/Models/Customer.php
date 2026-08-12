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
        'start_date',
        'rent_due_date',
        'rent_amount',
        'last_paid_date',
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

    public function rentPayments()
    {
        return $this->hasMany(RentPayment::class)->orderBy('payment_date', 'desc');
    }


}
