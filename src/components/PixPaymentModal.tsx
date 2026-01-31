"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Loader2, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface PixPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    totalAmount: number;
    onSuccess: () => void;
}

export function PixPaymentModal({ isOpen, onClose, orderId, totalAmount, onSuccess }: PixPaymentModalProps) {
    const [copied, setCopied] = useState(false);

    // Generates a fake "Copy and Paste" code based on the order ID to look persistent
    const mockCopyPasteCode = `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540${totalAmount.toFixed(2).replace('.', '')}5802BR5913Distribuidora6008BRASILIA62070503***6304${orderId.toString().slice(0, 4).toUpperCase()}`;

    useEffect(() => {
        if (!isOpen || !orderId) return;

        // Realtime Subscription to listen for status changes
        const channel = supabase
            .channel(`pix-modal-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    if (newStatus === 'preparing' || newStatus === 'paid') {
                        onSuccess();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, orderId, onSuccess]);

    const handleCopy = () => {
        navigator.clipboard.writeText(mockCopyPasteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold flex flex-col items-center gap-2">
                        <div className="bg-[#32BCAD] p-3 rounded-full mb-2">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        Pagamento via Pix
                    </DialogTitle>
                    <DialogDescription className="text-center text-neutral-400">
                        Escaneie o QR Code ou copie o código abaixo para pagar.
                        <br />
                        <span className="text-xs text-yellow-500 font-bold mt-2 block">(Modo Simulação: Aguardando aprovação no Admin)</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    {/* Mock QR Code Image */}
                    <div className="relative w-64 h-64 bg-white p-2 rounded-lg">
                        {/* Using a generic QR code placeholder or generating one via API if needed. 
                            For simulation, we can use a static placeholder or a generator service. */}
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${mockCopyPasteCode}`}
                            alt="QR Code Pix"
                            className="w-full h-full object-contain"
                        />

                        {/* Overlay Logo */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white p-1 rounded">
                                <img src="https://cdn-icons-png.flaticon.com/512/15505/15505295.png" alt="Pix" className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-2">
                        <p className="text-xs font-bold text-neutral-500 uppercase text-center">Pix Copia e Cola</p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-400 truncate select-all">
                                {mockCopyPasteCode}
                            </div>
                            <Button
                                size="icon"
                                variant="outline"
                                className="border-neutral-700 hover:bg-neutral-800 text-neutral-300 shrink-0"
                                onClick={handleCopy}
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#32BCAD] animate-pulse bg-[#32BCAD]/10 px-4 py-2 rounded-full">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-bold">Aguardando confirmação...</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
