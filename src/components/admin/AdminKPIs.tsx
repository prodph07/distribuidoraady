"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { Order } from "@/types";

interface AdminKPIsProps {
    orders: Order[];
}

export function AdminKPIs({ orders }: AdminKPIsProps) {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0);
    const totalOrdersCount = orders.length;
    const avgTicket = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    return (
        <section className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-400">Faturamento (Entregues)</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2).replace('.', ',')}</div>
                    <p className="text-xs text-neutral-500">Considerando apenas pedidos concluídos</p>
                </CardContent>
            </Card>
            <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-400">Total Pedidos</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalOrdersCount}</div>
                    <p className="text-xs text-neutral-500">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} pd em andamento</p>
                </CardContent>
            </Card>
            <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-neutral-400">Ticket Médio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">R$ {avgTicket.toFixed(2).replace('.', ',')}</div>
                </CardContent>
            </Card>
        </section>
    );
}
