import { ProductCard } from "@/components/ProductCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface ProductCarouselProps {
    title?: string;
    products: any[];
    viewAllLink?: string;
}

export function ProductCarousel({ title, products, viewAllLink }: ProductCarouselProps) {
    if (!products || products.length === 0) return null;

    return (
        <section>
            {title && (
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
                    {viewAllLink && (
                        <Link href={viewAllLink} className="text-gray-500 dark:text-gray-400 text-sm font-semibold hover:text-primary transition-colors flex items-center">
                            Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    )}
                </div>
            )}

            <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <div className="flex gap-4 w-max">
                    {products.map(product => (
                        <div key={product.id} className="min-w-[170px] w-[170px] sm:min-w-[180px] sm:w-[180px]">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
