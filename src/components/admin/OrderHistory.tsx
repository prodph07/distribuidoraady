"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format, subDays, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Filter, Search, Trash2, CheckCircle2, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'last7' | 'all'>('today');
    const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    const fetchHistory = async () => {
        setLoading(true);
        let query = supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    quantity,
                    products ( name )
                )
            `)
            .eq('archived', true)
            .order('created_at', { ascending: false });

        // Status Filter
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        // Date Filters
        const start = startOfDay(parseISO(startDate)).toISOString();
        const end = endOfDay(parseISO(endDate)).toISOString();

        if (dateRange !== 'all') {
            query = query.gte('created_at', start).lte('created_at', end);
        }

        const { data, error } = await query;

        if (error) {
            console.error(error);
        } else {
            setOrders(data as any || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        // Auto-set dates based on presets
        const today = new Date();
        if (dateRange === 'today') {
            setStartDate(format(today, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (dateRange === 'yesterday') {
            const yest = subDays(today, 1);
            setStartDate(format(yest, 'yyyy-MM-dd'));
            setEndDate(format(yest, 'yyyy-MM-dd'));
        } else if (dateRange === 'last7') {
            const last7 = subDays(today, 7);
            setStartDate(format(last7, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        }
    }, [dateRange]);

    useEffect(() => {
        fetchHistory();
    }, [startDate, endDate, statusFilter]);

    // Metrics
    const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-200">Histórico de Pedidos</h2>
                    <p className="text-gray-400">Consulte pedidos arquivados e métricas.</p>
                </div>

                <div className="flex gap-4 items-center">
                    {/* Status Filter */}
                    <div className="flex bg-neutral-800 p-1 rounded-lg border border-neutral-700 h-9">
                        <button onClick={() => setStatusFilter('all')} className={`px-3 text-xs font-bold rounded flex items-center gap-1 transition-all ${statusFilter === 'all' ? 'bg-neutral-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            Todos
                        </button>
                        <button onClick={() => setStatusFilter('delivered')} className={`px-3 text-xs font-bold rounded flex items-center gap-1 transition-all ${statusFilter === 'delivered' ? 'bg-green-600/20 text-green-400' : 'text-gray-500 hover:text-green-400/70'}`}>
                            <CheckCircle2 size={12} /> Entregues
                        </button>
                        <button onClick={() => setStatusFilter('cancelled')} className={`px-3 text-xs font-bold rounded flex items-center gap-1 transition-all ${statusFilter === 'cancelled' ? 'bg-red-600/20 text-red-500' : 'text-gray-500 hover:text-red-500/70'}`}>
                            <Ban size={12} /> Cancelados
                        </button>
                    </div>

                    <div className="flex bg-neutral-800 p-1 rounded-lg border border-neutral-700">
                        <button onClick={() => setDateRange('today')} className={`px-4 py-2 text-sm rounded-md transition-all ${dateRange === 'today' ? 'bg-neutral-600 text-white' : 'text-gray-400 hover:text-white'}`}>Hoje</button>
                        <button onClick={() => setDateRange('yesterday')} className={`px-4 py-2 text-sm rounded-md transition-all ${dateRange === 'yesterday' ? 'bg-neutral-600 text-white' : 'text-gray-400 hover:text-white'}`}>Ontem</button>
                        <button onClick={() => setDateRange('last7')} className={`px-4 py-2 text-sm rounded-md transition-all ${dateRange === 'last7' ? 'bg-neutral-600 text-white' : 'text-gray-400 hover:text-white'}`}>7 Dias</button>
                        <button onClick={() => setDateRange('all')} className={`px-4 py-2 text-sm rounded-md transition-all ${dateRange === 'all' ? 'bg-neutral-600 text-white' : 'text-gray-400 hover:text-white'}`}>Todos</button>
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white">Faturamento no Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white">Pedidos Arquivados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalOrders}</div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white">Ticket Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-900/50">
                        <TableRow className="border-neutral-700 hover:bg-neutral-900/50">
                            <TableHead className="text-gray-400">Data</TableHead>
                            <TableHead className="text-gray-400">Cliente</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400">Pagamento</TableHead>
                            <TableHead className="text-gray-400">Resumo</TableHead>
                            <TableHead className="text-right text-gray-400">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">Carregando histórico...</TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">Nenhum pedido arquivado neste período.</TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className="border-neutral-700 hover:bg-neutral-700/50">
                                    <TableCell className="text-gray-300 font-mono text-xs">
                                        {format(parseISO(order.created_at), "dd/MM/yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell className="font-medium text-white">
                                        {order.customer_name}
                                        <div className="text-xs text-gray-500">{order.customer_phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize ${order.status === 'delivered'
                                            ? 'bg-green-900/20 text-green-400 border-green-900/50'
                                            : order.status === 'cancelled'
                                                ? 'bg-red-900/20 text-red-500 border-red-900/50'
                                                : 'text-gray-400 border-gray-700'
                                            }`}>
                                            {order.status === 'delivered' ? 'Concluído' : order.status === 'cancelled' ? 'Cancelado' : order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-gray-300 uppercase">
                                                {order.payment_method === 'pix' ? 'PIX' :
                                                    order.payment_method === 'card_machine' ? 'Cartão' :
                                                        order.payment_method === 'money' ? 'Dinheiro' : 'Online'}
                                            </span>
                                            {order.payment_method === 'money' && order.change_needed && (
                                                <span className="text-[10px] text-gray-500">
                                                    Troco: R$ {order.change_needed.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400 text-sm max-w-xs truncate">
                                        {order.order_items?.map(i => `${i.quantity}x ${i.products?.name}`).join(', ')}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-green-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
