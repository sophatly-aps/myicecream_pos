<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    App\Models\Order::onlyTrashed();
    echo "onlyTrashed works on Order\n";
    App\Models\OrderDetail::onlyTrashed();
    echo "onlyTrashed works on OrderDetail\n";
    
    $order = App\Models\Order::withTrashed()->first();
    $order->details()->restore();
    echo "restore works on Order relation\n";
    $order->details()->forceDelete();
    echo "forceDelete works on Order relation\n";
    
} catch (\Exception $e) {
    echo get_class($e) . ': ' . $e->getMessage() . "\n" . $e->getTraceAsString();
}
