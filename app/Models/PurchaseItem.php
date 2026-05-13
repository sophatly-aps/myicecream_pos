<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    protected $fillable = [
        'supplier_id',
        'name',
        'unit',
        'price',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
