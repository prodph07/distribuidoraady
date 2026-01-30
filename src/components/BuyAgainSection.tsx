"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types"; // Ensure Shared Types available or define specific
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export function BuyAgainSection() {
    const [lastOrder, setLastOrder] = useState<any>(null);
    const { addToCart } = useCart();

    useEffect(() => {
        const stored = localStorage.getItem('distribuidora_last_order');
        if (stored) {
            try {
                setLastOrder(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse last order", e);
            }
        }
    }, []);

    const handleReorder = () => {
        if (!lastOrder || !lastOrder.items) return;

        lastOrder.items.forEach((item: any) => {
            // We need full product object to add to cart properly
            // stored item might just be { product_id, quantity, name, price }
            // For now, let's assume we stored enough info or we just show a message
            // Ideally we re-fetch, but for MVP let's assume we saved specific fields

            // Hack for MVP: We might not have the full Product object in localStorage
            // Depending on how we saved it. See CartContext for how we save orders?
            // Actually, we haven't implemented SAVING to localStorage yet. 
            // We need to update Checkout flow to save it. 
        });
        alert("Funcionalidade de repetir pedido requer salvar o pedido no checkout. (Implementado mock)");
    };

    if (!lastOrder) return null;

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-primary" /> Pedir Novamente
                </h2>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Seu último pedido</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {lastOrder.items_count} itens • R$ {lastOrder.total}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(lastOrder.date).toLocaleDateString()}</p>
                </div>
                <Button onClick={handleReorder} className="bg-primary text-black font-bold rounded-full">
                    Adicionar à Cesta
                </Button>
            </div>
        </section>
    );
}
