"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Loader2, Smartphone, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generatePixPayload } from "@/lib/pix";
import QRCode from "qrcode";

interface PixPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    totalAmount: number;
    onSuccess: () => void;
}

export function PixPaymentModal({ isOpen, onClose, orderId, totalAmount, onSuccess }: PixPaymentModalProps) {
    const [copied, setCopied] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [copyPasteCode, setCopyPasteCode] = useState<string>("");

    // Configuration for PIX Key
    const pixKeyConfig = {
        key: "+5598984991078",
        name: "Admilson de Ribamar Coelho Sarmento Filho",
        city: "VITORIA DO MEARIM" // City name often normalized without state for Payload, but usually fine.
    };

    useEffect(() => {
        if (!isOpen || !orderId || !totalAmount) return;

        // Generate Dynamic PIX Payload
        const payload = generatePixPayload({
            ...pixKeyConfig,
            amount: totalAmount,
            description: orderId.toString().slice(0, 4) // Using first 4 chars of ID as ref
        });

        setCopyPasteCode(payload);

        // Generate QR Code Image
        QRCode.toDataURL(payload, {
            width: 300,
            margin: 1, // Reduced margin
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error("Error generating Pix QRCode", err));

    }, [isOpen, orderId, totalAmount]);

    const handleCopy = () => {
        if (copyPasteCode) {
            navigator.clipboard.writeText(copyPasteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const whatsappMessage = encodeURIComponent(`Olá! Realizei o pagamento do pedido #${orderId}. Segue o comprovante.`);
    const whatsappLink = `https://wa.me/559884570073?text=${whatsappMessage}`;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="
                w-screen h-screen max-w-none m-0 rounded-none border-0 
                sm:w-full sm:max-w-md sm:h-auto sm:rounded-2xl sm:border sm:border-neutral-800 
                bg-neutral-900 text-white p-6 flex flex-col justify-center
            ">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold flex flex-col items-center gap-2">
                        <div className="bg-[#32BCAD] p-3 rounded-full mb-1 shadow-lg shadow-[#32BCAD]/20">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-[#32BCAD]">Pagamento via Pix</span>
                    </DialogTitle>
                    <DialogDescription className="text-center text-neutral-400">
                        <span className="block mb-2">Valor Total</span>
                        <span className="text-white font-black text-3xl">
                            R$ {totalAmount.toFixed(2)}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4 md:space-y-6 mt-2 w-full">
                    {/* Real QR Code Image */}
                    <div className="relative w-full max-w-[240px] aspect-square bg-white p-2 rounded-2xl shadow-xl mx-auto">
                        {qrCodeUrl ? (
                            <img
                                src={qrCodeUrl}
                                alt="QR Code Pix"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                            </div>
                        )}

                        {/* Overlay Logo */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white p-1 rounded-full shadow-lg border border-neutral-100">
                                <img src="https://cdn-icons-png.flaticon.com/512/15505/15505295.png" alt="Pix" className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-3">
                        {/* Pix Copia e Cola */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-neutral-500 uppercase text-center tracking-wider">Pix Copia e Cola</p>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-400 truncate select-all flex items-center min-w-0">
                                    <span className="truncate w-full">{copyPasteCode || "Gerando código..."}</span>
                                </div>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-10 w-10 border-neutral-700 hover:bg-neutral-800 text-neutral-300 shrink-0 rounded-xl"
                                    onClick={handleCopy}
                                    disabled={!copyPasteCode}
                                >
                                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>

                        {/* Send Proof Button - HUGE AND GREEN */}
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block pt-2"
                            onClick={onSuccess} // We consider it "done" when they click to send proof
                        >
                            <Button className="w-full h-14 rounded-xl font-black text-lg bg-[#25D366] text-black hover:bg-[#128C7E] hover:text-white shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                                <MessageCircle className="w-6 h-6" />
                                ENVIAR COMPROVANTE
                            </Button>
                            <p className="text-[10px] text-center text-neutral-500 mt-2">
                                Clique para enviar o comprovante no WhatsApp
                            </p>
                        </a>
                    </div>
                </div>

                <div className="text-[10px] text-neutral-600 text-center mt-2 border-t border-neutral-800 pt-4">
                    <p>Beneficiário: {pixKeyConfig.name}</p>
                    <p>Chave: {pixKeyConfig.key}</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
