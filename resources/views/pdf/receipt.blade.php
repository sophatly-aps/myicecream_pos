<style>
    body { font-family: 'khmeros', sans-serif; font-size: 12px; }
    .text-center { text-align: center; }
    .bold { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    .border-top { border-top: 1px dashed #000; }
</style>

<div class="text-center">
    <h3 class="bold">{{$company_name}}</h3>
    <p>វិក្កយបត្រ: {{ $order->invoice_no }}</p>
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
        @foreach($order->details as $item)
        <tr>
            <td>{{ $item->product->name }}</td>
            <td align="center">{{ $item->quantity }}</td>
            <td align="right">${{ number_format($item->subtotal, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div class="border-top" style="margin-top: 10px; padding-top: 5px;">
    <p align="right" class="bold">សរុបរួម: ${{ number_format($order->total_amount, 2) }}</p>
</div>

<p class="text-center" style="margin-top: 20px;">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត។</p>