"use client";
// export const runtime = 'edge'; // Disabled to ensure Realtime compatibility

import { useEffect, useState, use } from "react";
import { Header } from "@/components/Header";
import { CheckCircle2, Clock, Package, Bike, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";


const STEPS = [
    { id: 'pending_payment', label: 'Aguardando Pagamento', icon: Clock },
    { id: 'preparing', label: 'Preparando Pedido', icon: Package },
    { id: 'out_for_delivery', label: 'Saiu para Entrega', icon: Bike },
    { id: 'delivered', label: 'Pedido Entregue', icon: CheckCircle2 },
    { id: 'cancelled', label: 'Pedido Cancelado', icon: AlertCircle },
];

interface Order {
    id: string;
    status: string;
    address: string;
    total_amount: number;
    delivery_fee?: number;
    service_fee?: number;
}

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params); // Unwrap params
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Store Settings (Stripe)


    useEffect(() => {
        const fetchOrder = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching order:", error);
            } else {
                setOrder(data);
            }
            setLoading(false);
        };

        fetchOrder();

        // Realtime Subscription
        const channel = supabase
            .channel(`order-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${id}`
            }, (payload) => {
                console.log("Realtime update:", payload);
                setOrder(payload.new as Order);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col font-sans items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-neutral-400 font-bold">Buscando seu pedido...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col font-sans pb-16">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-16 h-16 text-neutral-700 mb-4" />
                    <h1 className="text-2xl font-black text-white">Pedido não encontrado</h1>
                    <p className="text-neutral-500">Verifique se o link está correto.</p>
                </main>
            </div>
        );
    }

    // Determine current step index
    // Handle cancelled status specifically or map it
    let currentStepIndex = STEPS.findIndex(s => s.id === order.status);

    // If status is not in the predefined list (e.g. some new status), default to 0 or handle logic
    // If cancelled, maybe show all grey or specific UI. For now, let's treat 'cancelled' as a step for visualization if it occurs.
    if (order.status === 'cancelled') {
        currentStepIndex = STEPS.findIndex(s => s.id === 'cancelled');
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col font-sans pb-16 text-neutral-200">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                <div className="space-y-6">
                    <div className="text-center space-y-2 mb-8">
                        <div className="inline-flex items-center justify-center p-4 bg-neutral-900 rounded-full shadow-sm mb-4 border border-neutral-800">
                            <img src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" alt="Delivery" className="h-12 w-12 opacity-80" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Pedido #{order.id}</h1>
                        <p className="text-neutral-400 flex items-center justify-center gap-2 font-medium bg-neutral-900 px-4 py-2 rounded-full shadow-sm w-fit mx-auto border border-neutral-800">
                            <MapPin className="w-4 h-4 text-primary" /> {order.address}
                        </p>
                    </div>

                    {/* Payment Action */}

                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-sm">
                        <div className="relative">
                            {/* Line connecting steps */}
                            <div className="absolute left-6 top-6 bottom-6 w-1 bg-neutral-800 rounded-full"></div>

                            <div className="space-y-10">
                                {STEPS.filter(s => order.status !== 'cancelled' ? s.id !== 'cancelled' : true).map((step, idx) => {
                                    // Calculate completion logic
                                    // If order is cancelled, only show cancelled step as active? Or show history?
                                    // Simple logic: if order is cancelled, only 'cancelled' is active/red.

                                    let isCompleted = false;
                                    let isCurrent = false;

                                    if (order.status === 'cancelled') {
                                        if (step.id === 'cancelled') {
                                            isCurrent = true;
                                            isCompleted = true;
                                        }
                                    } else {
                                        // Normal flow
                                        if (step.id === 'cancelled') return null; // Don't show cancelled step in normal flow
                                        isCompleted = idx <= currentStepIndex;
                                        isCurrent = idx === currentStepIndex;
                                    }

                                    return (
                                        <div key={step.id} className="relative flex items-center gap-6">
                                            <div className={cn(
                                                "relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all shadow-sm",
                                                isCompleted ? "bg-primary border-primary text-black" : "bg-neutral-800 border-neutral-700 text-neutral-500",
                                                isCurrent && "ring-4 ring-yellow-900/40 scale-110",
                                                step.id === 'cancelled' && isCurrent && "bg-red-600 border-red-600 text-white ring-red-900/40"
                                            )}>
                                                <step.icon className="w-6 h-6" />
                                            </div>
                                            <div className={cn("flex-1 p-4 rounded-xl transition-all", isCurrent ? "bg-yellow-900/10 border border-yellow-700/30 shadow-sm" : "bg-transparent", step.id === 'cancelled' && isCurrent && "bg-red-900/20 border-red-800/50")}>
                                                <h3 className={cn("font-bold text-lg", isCompleted ? "text-white" : "text-neutral-500", step.id === 'cancelled' && isCurrent && "text-red-400")}>{step.label}</h3>
                                                {isCurrent && step.id !== 'cancelled' && step.id !== 'delivered' && <span className="text-sm text-yellow-500 font-bold animate-pulse flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" /> Em andamento...
                                                </span>}
                                                {isCurrent && step.id === 'delivered' && <span className="text-sm text-green-500 font-bold flex items-center gap-2">
                                                    🎉 Bom apetite!
                                                </span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="bg-neutral-900 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-primary border border-neutral-800">
                            <div>
                                <p className="text-neutral-500 text-sm font-bold uppercase tracking-wider mb-1">Previsão de Entrega</p>
                                <p className="text-2xl font-black text-white">15-30 min</p>
                            </div>
                            <div className="h-12 w-12 bg-neutral-800 rounded-full flex items-center justify-center">
                                <Clock className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    )}

                    {/* Order Financial Summary */}
                    <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-3">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-primary rounded-full"></span>
                            Resumo do Pedido
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-neutral-400">
                                <span>Subtotal</span>
                                <span>R$ {(order.total_amount - (order.delivery_fee || 0) - (order.service_fee || 0)).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                                <span>Taxa de Entrega</span>
                                <span>R$ {(order.delivery_fee || 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                                <span>Taxa de Serviço</span>
                                <span>R$ {(order.service_fee || 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
                                <span className="font-bold text-white">Total</span>
                                <span className="text-xl font-black text-primary">R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </div>


                    <a
                        href={`https://wa.me/55${order.address ? '00000000000' : ''}`} // Placeholder, ideally use admin/store phone
                        target="_blank"
                        className="w-full block"
                    >
                        {/* We don't have store phone in env variable yet, so maybe just a button "Ajuda" that goes to a generic contact or disabled for now if strict */}
                        <Button className="w-full h-12 rounded-full font-bold text-base text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors bg-neutral-900 border border-neutral-800 shadow-sm">
                            Precisa de ajuda?
                        </Button>
                    </a>
                </div>
            </main>
        </div>
    );
}
