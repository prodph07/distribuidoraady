"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ProductExchangeDialog } from "./ProductExchangeDialog";
import { ProductDrawer } from "./ProductDrawer";
import { PostAddCartDialog } from "./PostAddCartDialog";
import { ImageIcon } from "lucide-react";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const router = useRouter();
    const { addToCart } = useCart();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isExchangeDialogOpen, setIsExchangeDialogOpen] = useState(false);
    const [isPostAddDialogOpen, setIsPostAddDialogOpen] = useState(false);
    const [pendingQuantity, setPendingQuantity] = useState(1);

    const maxStock = product.calculated_stock ?? product.stock_quantity;
    const isOutOfStock = maxStock <= 0;

    const handleAddClick = () => {
        if (isOutOfStock) return;
        setIsDrawerOpen(true);
    };

    const handleDrawerAddToCart = (quantity: number) => {
        setPendingQuantity(quantity);
        setIsDrawerOpen(false);

        if (product.is_returnable) {
            // Slight delay to allow drawer to close smooth
            setTimeout(() => {
                setIsExchangeDialogOpen(true);
            }, 300);
        } else {
            addToCart(product, quantity, false);
            setTimeout(() => {
                setIsPostAddDialogOpen(true);
            }, 300);
        }
    };

    const confirmExchange = (exchangeOption: "exchange" | "buy") => {
        addToCart(product, pendingQuantity, exchangeOption === "exchange");
        setIsPostAddDialogOpen(true);
    };

    return (
        <>
            <div className={`bg-card rounded-3xl overflow-hidden shadow-sm border border-border flex flex-col h-full group transition-all ${!isOutOfStock ? 'hover:shadow-md hover:-translate-y-1' : ''}`}>
                <div
                    className={`relative aspect-square bg-white p-4 overflow-hidden flex items-center justify-center ${!isOutOfStock ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    onClick={handleAddClick}
                >
                    {product.image_url ? (
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className={`object-contain p-2 transition-transform ${!isOutOfStock ? 'group-hover:scale-110' : 'grayscale'}`}
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-neutral-200">
                            <ImageIcon size={48} strokeWidth={1.5} />
                        </div>
                    )}

                    {product.is_combo && (
                        <div className="absolute top-3 left-3 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                            Combo
                        </div>
                    )}
                    {product.is_returnable && (
                        <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-red-200">
                            Retornável
                        </div>
                    )}
                </div>

                <div className="p-4 flex flex-col flex-1 bg-card">
                    <h3 className="font-semibold text-base leading-tight mb-1 text-foreground line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-1">
                        {product.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium">R$</span>
                            <span className="text-lg font-black text-foreground -mt-1">
                                {product.price.toFixed(2).replace(".", ",")}
                            </span>
                        </div>
                        <Button
                            onClick={handleAddClick}
                            disabled={isOutOfStock}
                            className={`rounded-full h-10 font-bold shadow-sm transition-transform ${isOutOfStock ? 'w-28 opacity-80' : 'w-24 hover:scale-105'}`}
                            variant={isOutOfStock ? "secondary" : "default"}
                        >
                            {isOutOfStock ? "ESGOTADO" : "ADICIONAR"}
                        </Button>
                    </div>
                </div>
            </div>

            <ProductDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                product={product}
                onAddToCart={handleDrawerAddToCart}
            />

            <ProductExchangeDialog
                open={isExchangeDialogOpen}
                onOpenChange={setIsExchangeDialogOpen}
                product={product}
                onConfirm={confirmExchange}
            />

            <PostAddCartDialog
                open={isPostAddDialogOpen}
                onOpenChange={setIsPostAddDialogOpen}
                onContinue={() => setIsPostAddDialogOpen(false)}
                onReview={() => {
                    setIsPostAddDialogOpen(false);
                    router.push('/checkout');
                }}
            />
        </>
    );
}
