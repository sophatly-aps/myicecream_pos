// resources/js/Pages/pos/components/ProductCard.tsx
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Product {
    id: number;
    name: string;
    selling_price: number;
    image: string;
}

interface Props {
    products: Product;
}

export default function ProductCard({ products }: Props) {
    return (
        <Card className="rounded-2xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
            <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img
                    src={products.image ?? 'https://via.placeholder.com/300x200'} // Fallback
                    alt={products.name}
                    className="w-full h-full object-cover"
                />
                {/* Optional Status Badge top-right */}
                <Badge className="absolute top-2 right-2 bg-blue-600">Active</Badge>
            </div>
            <CardHeader className="p-4">
                <CardTitle className="text-md font-khmer leading-snug">{products.name}</CardTitle>
                <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-bold text-blue-700">{products.selling_price}</span>
                </div>
            </CardHeader>
        </Card>
    );
}