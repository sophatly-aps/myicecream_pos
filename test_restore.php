<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $order = App\Models\Order::onlyTrashed()->first();
    if ($order) {
        $order->restore();
        $order->details()->restore();
        echo "Order {$order->id} restored successfully.\n";
    } else {
        echo "No trashed orders found.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
