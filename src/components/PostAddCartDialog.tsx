"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";

interface PostAddCartDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onContinue: () => void;
    onReview: () => void;
}

export function PostAddCartDialog({
    open,
    onOpenChange,
    onContinue,
    onReview,
}: PostAddCartDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-neutral-100">
                <DialogHeader className="items-center text-center space-y-4 pt-4">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <DialogTitle className="text-xl font-bold">Produto Adicionado!</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-base">
                            O item foi adicionado ao seu carrinho com sucesso. O que deseja fazer agora?
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={onContinue}
                        className="w-full h-12 rounded-xl text-base font-medium border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Continuar Comprando
                    </Button>
                    <Button
                        onClick={onReview}
                        className="w-full h-12 rounded-xl text-base font-bold bg-primary text-black hover:bg-primary/90"
                    >
                        Revisar Pedido
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
