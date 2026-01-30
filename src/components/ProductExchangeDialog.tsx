"use client";

import { useState } from "react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Check } from "lucide-react";

interface ProductExchangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    onConfirm: (exchangeOption: "exchange" | "buy") => void;
}

export function ProductExchangeDialog({
    open,
    onOpenChange,
    product,
    onConfirm,
}: ProductExchangeDialogProps) {
    const handleConfirm = () => {
        // Always pass "exchange" as buying the bottle is no longer an option
        onConfirm("exchange");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{product.name}</DialogTitle>
                    <DialogDescription>
                        Este produto é <strong>retornável</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col gap-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg flex gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                        <div className="text-yellow-800 dark:text-yellow-200">
                            <p className="font-bold mb-1">Atenção!</p>
                            <p>Para comprar este item, você <strong>precisa entregar um vasilhame vazio</strong> equivalente para o entregador.</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Preço do líquido:</p>
                        <p className="text-3xl font-black text-primary">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} className="w-full sm:w-1/2 font-bold bg-green-600 hover:bg-green-700 text-white">
                        <Check className="w-4 h-4 mr-2" />
                        Tenho o vasilhame
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
