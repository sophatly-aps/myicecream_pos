<style>
    body {
        font-family: 'khmeros', sans-serif;
        font-size: 12px;
    }

    .text-center {
        text-align: center;
    }

    .bold {
        font-weight: bold;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    .border-top {
        border-top: 1px dashed #000;
    }
</style>

<div class="text-center">
    <h3 class="bold" style="margin: 0 0 5px 0;">{{ $company_name }}</h3>
    <p style="margin: 0;">វិក្កយបត្រ: {{ $order->invoice_no }}</p>
    <p style="margin: 0;">កាលបរិច្ឆេទ: {{ \Carbon\Carbon::parse($order->order_date)->format('d/m/Y') }}</p>
    <p style="margin: 0;">អតិថិជន: {{ $order->customer ? $order->customer->name : 'Walk-in Customer' }}</p>
</div>

<table>
    <thead>
        <tr class="border-top">
            <th align="left">មុខទំនិញ</th>
            <th align="center">ចំនួន</th>
            <th align="right">តម្លៃ</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($order->details as $item)
            <tr>
                <td>{{ $item->product->name }}</td>
                <td align="center">{{ $item->quantity }}</td>
                <td align="right">{{ $currency }}{{ number_format($item->subtotal, 2) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="border-top" style="margin-top: 10px; padding-top: 5px;">
    <table style="width: 100%;">
        <tr>
            <td valign="top" align="left" style="font-size: 10px; padding-right: 5px;">
                @if ($order->customer_total_due > 0 || $order->customer_total_paid > 0)
                    <div style="background-color: #f3f4f6; padding: 5px; border-radius: 3px;">
                        <u>កំណត់សម្គាល់៖</u><br>
                        ប្រាក់បានបង់៖<br>
                        <b>{{ $currency }}{{ number_format($order->customer_total_paid, 2) }}</b><br>
                        ប្រាក់ជំពាក់៖<br>
                        <b style="color: red;">{{ $currency }}{{ number_format($order->customer_total_due, 2) }}</b>
                    </div>
                @endif
            </td>
            <td valign="top" align="right">
                <p class="bold" style="margin: 0 0 5px 0;">សរុបរួម៖ {{ $currency }}{{ number_format($order->total_amount, 2) }}</p>
                @if ($order->payment_status === 'due' || $order->payment_status === 'partial')
                    <p style="margin: 0; padding-top: 5px;">ប្រាក់បានបង់៖ {{ $currency }}{{ number_format($order->paid_amount, 2) }}</p>
                    <p style="margin: 0; padding-top: 5px;">ប្រាក់ជំពាក់៖ {{ $currency }}{{ number_format($order->due_amount, 2) }}</p>
                @endif
            </td>
        </tr>
    </table>
</div>

<p class="text-center" style="margin-top: 20px;">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត។</p>
