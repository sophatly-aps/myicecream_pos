<!DOCTYPE html>
<html lang="km">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google" content="notranslate">
    <title>Receipt {{ $order->invoice_no }}</title>
    <style>
        /* Define the page to have zero margins so the printer doesn't add its own blank space */
        @page {
            margin: 0;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'khmeros', sans-serif, Arial;
            font-size: 12px;
            margin: 0 auto;
            /* width roughly equates to 80mm thermal paper printable area */
            width: 78mm;
            padding: 5mm;
            color: #000;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .bold {
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            padding: 4px 0;
            font-size: 12px;
        }

        .border-top {
            border-top: 1px dashed #000;
        }

        .border-bottom {
            border-bottom: 1px dashed #000;
        }

        /* Ensures the items don't break arbitrarily */
        tr {
            page-break-inside: avoid;
        }
    </style>
</head>

<body>
    <div class="text-center">
        <h3 class="bold" style="margin: 0 0 5px 0;">{{ $company_name }}</h3>
        <p style="margin: 0;">វិក្កយបត្រ: {{ $order->invoice_no }}</p>
        <p style="margin: 0;">កាលបរិច្ឆេទ: {{ \Carbon\Carbon::parse($order->order_date)->format('d/m/Y') }}</p>
        <p style="margin: 0;">អតិថិជន: {{ $order->customer ? $order->customer->name : 'Walk-in Customer' }}</p>
    </div>

    <table>
        <thead>
            <tr class="border-top border-bottom">
                <th align="left">មុខទំនិញ</th>
                <th align="center">ចំនួន</th>
                <th align="right">តម្លៃ</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->details as $item)
                <tr>
                    <td>{{ $item->product ? $item->product->name : 'N/A' }}</td>
                    <td align="center">{{ $item->quantity }}</td>
                    <td align="right">{{ $currency }}{{ number_format($item->subtotal, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="border-top" style="margin-top: 10px; padding-top: 5px;">
        <table style="width: 100%; margin-top: 0;">
            <tr>
                <td valign="top" align="left" style="font-size: 10px; padding-right: 5px; width: 45%;">
                    @if ($order->customer_total_due > 0 || $order->customer_total_paid > 0)
                        <div style="background-color: #f3f4f6; padding: 5px; border-radius: 3px; border: 1px dashed #ccc;">
                            <u style="font-weight: bold;">កំណត់សម្គាល់៖</u><br>
                            សរុបបានបង់៖<br>
                            <b>{{ $currency }}{{ number_format($order->customer_total_paid, 2) }}</b><br>
                            សរុបជំពាក់៖<br>
                            <b style="color: #dc2626;">{{ $currency }}{{ number_format($order->customer_total_due, 2) }}</b>
                        </div>
                    @endif
                </td>
                <td valign="top" align="right">
                    <table style="margin-top:0; width: 100%;">
                        <tr>
                            <td align="right" class="bold">សរុបរង៖</td>
                            <td align="right" class="bold">{{ $currency }}{{ number_format($order->sub_total, 2) }}</td>
                        </tr>

                        @if ($order->tax_amount > 0)
                            <tr>
                                <td align="right">ពន្ធ៖</td>
                                <td align="right">{{ $currency }}{{ number_format($order->tax_amount, 2) }}</td>
                            </tr>
                        @endif

                        @if ($order->discount_amount > 0)
                            <tr>
                                <td align="right">បញ្ចុះតម្លៃ៖</td>
                                <td align="right">- {{ $currency }}{{ number_format($order->discount_amount, 2) }}</td>
                            </tr>
                        @endif

                        @if ($order->transport_fee > 0)
                            <tr>
                                <td align="right">ដឹកជញ្ជូន៖</td>
                                <td align="right">{{ $currency }}{{ number_format($order->transport_fee, 2) }}</td>
                            </tr>
                        @endif

                        <tr>
                            <td align="right" class="bold">សរុបរួម៖</td>
                            <td align="right" class="bold">{{ $currency }}{{ number_format($order->total_amount, 2) }}</td>
                        </tr>
                        <tr>
                            <td align="right">ប្រាក់ទទួល៖</td>
                            <td align="right">{{ $currency }}{{ number_format($order->paid_amount, 2) }}</td>
                        </tr>
                        @if ($order->payment_status === 'due' || $order->payment_status === 'partial')
                            <tr>
                                <td align="right">ប្រាក់ជំពាក់៖</td>
                                <td align="right">{{ $currency }}{{ number_format($order->due_amount, 2) }}</td>
                            </tr>
                        @else
                            <tr>
                                <td align="right">ប្រាក់អាប់៖</td>
                                <td align="right">{{ $currency }}{{ number_format($order->change_amount, 2) }}</td>
                            </tr>
                        @endif
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <p class="text-center" style="margin-top: 20px;">សូមអរគុណ!</p>

    <script>
        window.onload = function() {
            // Add a tiny delay to ensure fonts and layout settle before printing
            setTimeout(function() {
                window.focus();
                window.print();
            }, 250);
        }
    </script>
</body>

</html>
