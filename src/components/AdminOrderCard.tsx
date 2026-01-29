"use client";

import { Button } from "@/components/ui/button";
import { Beer, Archive, Phone, Ban, MapPin, CheckCircle2, Link as LinkIcon, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Order } from "@/types";




export function AdminOrderCard({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, status: string) => void }) {
    const hasExchange = order.order_items?.some((i) => i.is_exchange) || false;

    const handleWhatsApp = () => {
        // "PEDIDO PAGO #99 📍 Rua X, Número Y ⚠️ ATENÇÃO: RECOLHER 5 GARRAFAS DE 600ML Link do GPS: [url]"
        const exchangeItems = order.order_items?.filter(i => i.is_exchange) || [];
        const exchangeText = exchangeItems.length > 0
            ? `⚠️ ATENÇÃO: RECOLHER ${exchangeItems.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}`
            : "✅ NENHUM CASCO PARA RECOLHER";

        const magicLink = `${window.location.origin}/status/${order.id}`;

        const text = `🛺 *PEDIDO #${order.id} A CAMINHO!*
Olha ${order.customer_name.split(' ')[0]}, acompanhe seu pedido em tempo real:
🔗 *${magicLink}*

📍 *Entrega em:* ${order.address}
${exchangeText}`;

        window.open(`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleCopyLink = () => {
        const magicLink = `${window.location.origin}/status/${order.id}`;
        navigator.clipboard.writeText(magicLink);
        // Simple visual feedback could be added here, but for MVP just copy
        alert("Link copiado!");
    };

    const handleRefund = () => {
        if (confirm("Tem certeza que deseja cancelar e estornar este pedido?")) {
            onUpdateStatus(order.id, 'cancelled');
        }
    };

    // Render Actions based on Status
    const renderActions = () => {
        if (order.status === 'pending_payment') {
            return (
                <div className="flex gap-2 w-full mt-2">
                    <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                    >
                        ✅ Aceitar Pedido
                    </Button>
                    <Button
                        variant="destructive"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => onUpdateStatus(order.id, 'cancelled')}
                    >
                        ❌ Recusar
                    </Button>
                </div>
            );
        }

        if (order.status === 'preparing') {
            return (
                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                    onClick={() => onUpdateStatus(order.id, 'out_for_delivery')}
                >
                    🛵 Saiu para Entrega
                </Button>
            );
        }

        if (order.status === 'out_for_delivery') {
            return (
                <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-2"
                    onClick={() => onUpdateStatus(order.id, 'delivered')}
                >
                    🏁 Marcar como Entregue
                </Button>
            );
        }

        if (order.status === 'delivered') {
            return <div className="text-center w-full py-2 text-green-500 font-bold text-sm bg-green-900/20 rounded">Pedido Concluído</div>;
        }

        if (order.status === 'cancelled') {
            return <div className="text-center w-full py-2 text-red-500 font-bold text-sm bg-red-900/20 rounded">Pedido Cancelado</div>;
        }

        return null;
    };

    return (
        <div className={cn("bg-neutral-800 border-l-4 rounded-r-lg shadow-sm p-4 space-y-4 border border-y-neutral-700 border-r-neutral-700 animate-in fade-in slide-in-from-bottom-2 duration-300", hasExchange ? "border-l-red-500 bg-red-900/10" : "border-l-green-500")}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-neutral-100 flex items-center gap-2">
                        #{order.id}
                        <span className="text-xs font-normal text-neutral-400 bg-neutral-700 px-2 py-0.5 rounded-full capitalize">
                            {order.status.replace('_', ' ')}
                        </span>
                    </h3>
                    <p className="text-sm text-neutral-300 font-medium">{order.customer_name}</p>
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {order.address}
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    {hasExchange ? (
                        <div className="flex items-center gap-1 text-red-400 font-bold text-xs bg-red-900/30 px-2 py-1 rounded border border-red-900/50">
                            <Beer className="w-4 h-4" /> RECOLHER CASCO
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-green-400 font-bold text-xs bg-green-900/30 px-2 py-1 rounded border border-green-900/50">
                            <CheckCircle2 className="w-4 h-4" /> SEM TROCA
                        </div>
                    )}
                    <span className="font-bold mt-1 text-xl text-neutral-200">R$ {order.total_amount.toFixed(2).replace(".", ",")}</span>
                </div>
            </div>

            <div className="space-y-2 border-t border-dashed border-neutral-700 pt-2">
                {order.order_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-neutral-300">
                        <span>{item.quantity}x {item.product?.name || `Item ${item.product_id}`}</span>
                        <span className="font-medium text-xs uppercase px-2 py-0.5 rounded bg-neutral-700 text-neutral-300">
                            {item.is_exchange ? '🔄 Troca' : '🆕 Casco'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700">
                {/* Status Actions */}
                {renderActions()}

                {/* Utils */}
                <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent hover:bg-neutral-700 text-neutral-400 border-neutral-600" onClick={handleCopyLink}>
                        <LinkIcon className="w-4 h-4 mr-2" /> Copiar Link
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-green-900/20 hover:bg-green-900/40 text-green-400 border-green-900/50" onClick={handleWhatsApp}>
                        <Share2 className="w-4 h-4 mr-2" /> Enviar Zap
                    </Button>
                </div>
            </div>
        </div>
    );
}
