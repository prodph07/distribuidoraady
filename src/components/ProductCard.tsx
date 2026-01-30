"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ProductExchangeDialog } from "./ProductExchangeDialog";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAdd = () => {
        if (product.is_returnable) {
            setIsDialogOpen(true);
        } else {
            addToCart(product, 1, false);
        }
    };

    const confirmExchange = (exchangeOption: "exchange" | "buy") => {
        addToCart(product, 1, exchangeOption === "exchange");
    };

    return (
        <>
            <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border flex flex-col h-full group transition-all hover:shadow-md hover:-translate-y-1">
                <div className="relative aspect-square bg-white p-4 overflow-hidden flex items-center justify-center">
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-2 transition-transform group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 33vw"
                    />
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
                            onClick={handleAdd}
                            className="rounded-full w-24 h-10 font-bold shadow-sm hover:scale-105 transition-transform"
                            variant="default"
                        >
                            ADICIONAR
                        </Button>
                    </div>
                </div>
            </div>

            <ProductExchangeDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                product={product}
                onConfirm={confirmExchange}
            />
        </>
    );
}
