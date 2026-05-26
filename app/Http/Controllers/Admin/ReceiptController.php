<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Setting;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

class ReceiptController extends Controller
{
    public function receipt($id)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $company_name = $settings['name'];
        $order = Order::with(['details.product', 'customer', 'cashier'])->findOrFail($id);

        $mpdf = new Mpdf([
            'fontDir' => array_merge((new ConfigVariables)->getDefaults()['fontDir'], [resource_path('fonts')]),
            'fontdata' => (new FontVariables)->getDefaults()['fontdata'] + [
                'khmeros' => ['R' => 'KhmerOS.ttf', 'useOTL' => 0xFF],
            ],
            'default_font' => 'khmeros',
            'format' => [80, 200],
            'margin_left' => 2, 'margin_right' => 2, 'margin_top' => 5, 'margin_bottom' => 5,
        ]);

        $html = view('pdf.receipt', compact('order', 'company_name'))->render();
        $mpdf->WriteHTML($html);

        $mpdf->SetJS('this.print();');

        return $mpdf->Output("Invoice-{$order->invoice_no}.pdf", 'I');
    }

    public function printHtml($id)
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        $currency = $settings['currency_symbol'] ?? '$';
        $company_name = $settings['name'];
        $order = Order::with(['details.product', 'customer', 'cashier'])->findOrFail($id);

        return view('pdf.print', compact('order', 'company_name', 'currency'));
    }
}
