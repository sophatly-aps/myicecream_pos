// resources/js/Pages/pos/components/CartItem.tsx
import { Button } from "@/components/ui/button"

interface Product {
    id: number;
    name: string;
    selling_price: number;
    image: string;
    qty?: number;
}

interface Props {
    item: Product;
}

export default function CartItem({ item }: Props) {
    return (
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl">
            <img
                src={item.image ?? 'https://via.placeholder.com/60x60'}
                className="w-14 h-14 rounded-lg object-cover"
                alt={item.name}
            />
            <div className="flex-1">
                <p className="font-khmer text-sm">{item.name}</p>
                <p className="text-lg font-bold text-blue-700">${item.selling_price}</p>
            </div>
            {/* QUANTITY CONTROL */}
            <div className="flex items-center gap-2 border rounded-full px-1 py-1 bg-white">
                <Button variant="ghost" size="sm" className="rounded-full px-2 h-7">-</Button>
                <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                <Button variant="ghost" size="sm" className="rounded-full px-2 h-7">+</Button>
            </div>
            <Button variant="ghost" size="sm" className="text-red-600">
                {/*🗑️ Trash Icon */}
            </Button>
        </div>
    );
}