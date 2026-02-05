"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bike } from "lucide-react";

export function DeliveryDisclaimer() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if we've already shown the disclaimer in this session
        const hasSeenDisclaimer = sessionStorage.getItem("delivery-disclaimer-seen");

        if (!hasSeenDisclaimer) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        sessionStorage.setItem("delivery-disclaimer-seen", "true");
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-primary/20 p-3 rounded-full">
                            <Bike className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-xl">Aviso Importante</DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        Os valores apresentados no aplicativo são válidos <span className="font-bold text-foreground">apenas para Delivery</span>.
                        <br /><br />
                        Horário de funcionamento: <span className="font-bold text-foreground">09h às 21h</span>.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center">
                    <Button type="button" onClick={handleClose} className="w-full sm:w-auto min-w-[120px] font-bold">
                        Entendi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
