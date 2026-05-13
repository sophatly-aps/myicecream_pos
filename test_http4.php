<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$order = App\Models\Order::first();
if (!$order) {
    echo "No orders\n";
    exit;
}
$controller = new App\Http\Controllers\Admin\SaleController();
try {
    $controller->destroy($order->id);
    echo "Trashed order {$order->id}\n";
    
    $response = $controller->restore($order->id);
    echo "Restore Response: " . $response->getContent() . "\n";
    
    $controller->destroy($order->id); // trash it again
    
    $response2 = $controller->forceDelete($order->id);
    echo "Force Delete Response: " . $response2->getContent() . "\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
