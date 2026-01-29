"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [exchangeOption, setExchangeOption] = useState<"exchange" | "buy" | null>(null);

    const handleAdd = () => {
        if (product.is_returnable) {
            setIsOpen(true);
        } else {
            addToCart(product, 1, false);
        }
    };

    const confirmAdd = () => {
        if (!exchangeOption) return;
        addToCart(product, 1, exchangeOption === "exchange");
        setIsOpen(false);
        setExchangeOption(null);
    };

    const totalPrice =
        exchangeOption === "buy"
            ? product.price + product.deposit_price
            : product.price;

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

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{product.name}</DialogTitle>
                        <DialogDescription>
                            Este produto é retornável. Você possui o vasilhame?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <RadioGroup
                            value={exchangeOption || ""}
                            onValueChange={(v) => setExchangeOption(v as "exchange" | "buy")}
                            className="gap-4"
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-between space-x-2 border p-4 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                                    exchangeOption === "exchange" ? "border-primary bg-primary/5" : "border-input"
                                )}
                                onClick={() => setExchangeOption("exchange")}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="exchange" id="exchange" />
                                    <Label htmlFor="exchange" className="cursor-pointer">
                                        <span className="font-bold block">Tenho a garrafa vazia</span>
                                        <span className="text-xs text-muted-foreground">O motoboy recolherá na entrega.</span>
                                    </Label>
                                </div>
                                <span className="font-bold text-primary">R$ {product.price.toFixed(2).replace(".", ",")}</span>
                            </div>

                            <div
                                className={cn(
                                    "flex items-center justify-between space-x-2 border p-4 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                                    exchangeOption === "buy" ? "border-primary bg-primary/5" : "border-input"
                                )}
                                onClick={() => setExchangeOption("buy")}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="buy" id="buy" />
                                    <Label htmlFor="buy" className="cursor-pointer">
                                        <span className="font-bold block">Preciso do vasilhame</span>
                                        <span className="text-xs text-muted-foreground">Você compra a garrafa nova.</span>
                                    </Label>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-primary block">R$ {(product.price + product.deposit_price).toFixed(2).replace(".", ",")}</span>
                                    <span className="text-[10px] text-muted-foreground">(+ R$ {product.deposit_price.toFixed(2)} casco)</span>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    <DialogFooter className="sm:justify-between items-center gap-4">
                        <div className="text-sm text-center sm:text-left">
                            {exchangeOption === "exchange" && (
                                <span className="text-yellow-500 font-medium text-xs">⚠️ Motoboy recolherá o casco vazio.</span>
                            )}
                            {exchangeOption === "buy" && (
                                <span className="text-green-500 font-medium text-xs">✅ Garrafa nova será sua.</span>
                            )}
                        </div>
                        <Button onClick={confirmAdd} disabled={!exchangeOption} className="w-full sm:w-auto">
                            Confirmar - R$ {exchangeOption ? totalPrice.toFixed(2).replace(".", ",") : "..."}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
