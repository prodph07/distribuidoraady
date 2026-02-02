"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import Link from "next/link";
import { Clock, Package, Bike, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, QrCode } from "lucide-react";

interface Order {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    payment_method?: string;
    order_items?: {
        quantity: number;
        product?: { name: string } | { name: string }[];
    }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
    'pending_payment': { label: 'Aguardando Pagamento', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
    'preparing': { label: 'Preparando', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Package },
    'out_for_delivery': { label: 'Saiu para Entrega', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Bike },
    'delivered': { label: 'Entregue', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
    'cancelled': { label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
};

export default function PedidosPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderForPix, setSelectedOrderForPix] = useState<Order | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            // Get user phone from local storage
            const savedData = localStorage.getItem("customer_data");
            if (!savedData) {
                setLoading(false);
                return;
            }

            const { phone } = JSON.parse(savedData);
            if (!phone) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, 
                    created_at, 
                    status, 
                    total_amount,
                    order_items (
                        quantity,
                        product:products (
                            name
                        )
                    )
                `)
                .eq('customer_phone', phone)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setOrders(data);
            }
            setLoading(false);
        };

        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col font-sans text-neutral-200">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-primary" />
                        Meus Pedidos
                    </h1>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-neutral-900 rounded-3xl border border-neutral-800">
                        <div className="bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Nenhum pedido encontrado</h2>
                        <p className="text-neutral-400 mb-6">Parece que você ainda não fez nenhum pedido conosco.</p>
                        <Link href="/">
                            <Button className="font-bold rounded-full bg-primary text-black hover:bg-yellow-400">
                                Ver Cardápio
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusConfig = STATUS_MAP[order.status] || STATUS_MAP['pending_payment'];
                            const StatusIcon = statusConfig.icon;

                            // Summarize items
                            const itemsSummary = order.order_items?.map(item => {
                                const productName = Array.isArray(item.product)
                                    ? item.product[0]?.name
                                    : item.product?.name;
                                return `${item.quantity}x ${productName || 'Item'}`;
                            }).join(', ');

                            return (
                                <div key={order.id} className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 transition-all hover:border-neutral-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs text-neutral-500 font-mono mb-1">#{order.id.toString().slice(0, 8)}</p>
                                            <p className="text-sm text-neutral-400">
                                                {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${statusConfig.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {statusConfig.label}
                                        </Badge>
                                    </div>

                                    {/* Items Summary */}
                                    <div className="text-sm text-neutral-300 mb-4 line-clamp-2">
                                        {itemsSummary}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                                        <span className="font-black text-white text-lg">
                                            R$ {order.total_amount.toFixed(2).replace('.', ',')}
                                        </span>

                                        <div className="flex gap-2">
                                            {order.status === 'pending_payment' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-full border-[#32BCAD] text-[#32BCAD] hover:bg-[#32BCAD] hover:text-white"
                                                    onClick={() => setSelectedOrderForPix(order)}
                                                >
                                                    <QrCode className="w-4 h-4 mr-1" />
                                                    Pagar
                                                </Button>
                                            )}

                                            <Link href={`/status/${order.id}`}>
                                                <Button size="sm" className="rounded-full font-bold bg-neutral-800 hover:bg-neutral-700 text-white">
                                                    Detalhes <ArrowRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {selectedOrderForPix && (
                <PixPaymentModal
                    isOpen={!!selectedOrderForPix}
                    onClose={() => setSelectedOrderForPix(null)}
                    orderId={selectedOrderForPix.id}
                    totalAmount={selectedOrderForPix.total_amount}
                    onSuccess={() => setSelectedOrderForPix(null)}
                />
            )}
        </div>
    );
}
