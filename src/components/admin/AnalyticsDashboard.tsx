"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { format, subDays, parseISO, isSameDay, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Filter, TrendingUp, DollarSign, Award, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DateRange = {
    from: Date | undefined;
    to: Date | undefined;
};

export function AnalyticsDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7' | '15' | '30' | 'custom'>('7');
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });

    const fetchAnalyticsData = async () => {
        if (!dateRange?.from) return;

        setLoading(true);

        const from = startOfDay(dateRange.from).toISOString();
        const to = endOfDay(dateRange.to || dateRange.from || new Date()).toISOString();

        // Fetch all delivered orders (active or archived)
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    quantity,
                    price_snapshot,
                    is_exchange,
                    products ( id, name, category, cost_price )
                )
            `)
            .in('status', ['delivered']) // Only completed orders
            .gte('created_at', from)
            .lte('created_at', to)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching analytics:", error);
        } else {
            console.log("Analytics Data Fetched:", data?.length);
            setOrders(data as any || []);
        }
        setLoading(false);
    };

    // Update DateRange when preset changes
    useEffect(() => {
        if (period !== 'custom') {
            const days = parseInt(period);
            setDateRange({
                from: subDays(new Date(), days),
                to: new Date()
            });
        }
    }, [period]);

    // Fetch when dateRange changes
    useEffect(() => {
        if (dateRange?.from && dateRange?.to) {
            fetchAnalyticsData();
        }
    }, [dateRange]);

    // --- Data Processing ---

    // 0. KPI Metrics
    const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const totalCost = orders.reduce((acc, o) => {
        const orderCost = o.order_items?.reduce((itemAcc, item: any) => {
            const productCost = item.products?.cost_price || 0;
            return itemAcc + (productCost * item.quantity);
        }, 0) || 0;
        return acc + orderCost;
    }, 0);
    const totalNetProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;


    // 1. Daily Sales & Profit
    const daysDiff = dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) + 1 : parseInt(period);
    const chartDays = Math.max(daysDiff || 1, 1);

    const dailyData = Array.from({ length: chartDays }, (_, i) => {
        const d = subDays(dateRange?.to || new Date(), chartDays - 1 - i);
        return {
            date: format(d, 'dd/MM'),
            fullDate: d,
            sales: 0,
            profit: 0
        };
    });

    orders.forEach(order => {
        const orderDate = parseISO(order.created_at);
        const dayStat = dailyData.find(d => isSameDay(d.fullDate, orderDate));

        if (dayStat) {
            const revenue = Number(order.total_amount) || 0;

            // Calculate Cost for this order
            const cost = order.order_items?.reduce((acc, item: any) => {
                const productCost = item.products?.cost_price || 0;
                return acc + (productCost * item.quantity);
            }, 0) || 0;

            dayStat.sales += revenue;
            dayStat.profit += (revenue - cost);
        }
    });

    // 2. Top Products (Global)
    const productSales: Record<number, { name: string, quantity: number, category: string }> = {};

    orders.forEach(order => {
        order.order_items?.forEach((item: any) => {
            if (!item.products) return;
            const pid = item.products.id;
            if (!productSales[pid]) {
                productSales[pid] = {
                    name: item.products.name,
                    quantity: 0,
                    category: item.products.category || 'Outros'
                };
            }
            productSales[pid].quantity += item.quantity;
        });
    });

    const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    const top10Global = sortedProducts.slice(0, 10);

    // 3. Top Products per Category (Grouped)
    const topByCategory: Record<string, typeof sortedProducts> = {};

    sortedProducts.forEach(p => {
        const cat = p.category || 'Outros';
        if (!topByCategory[cat]) topByCategory[cat] = [];
        if (topByCategory[cat].length < 5) {
            topByCategory[cat].push(p);
        }
    });

    // Formatting currency
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6">
            {/* Header / Filter */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <TrendingUp className="text-primary" /> Painel de Performance
                    </h2>
                    <p className="text-sm text-neutral-400">
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>Período: {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}</>
                            ) : (
                                <>Período: {format(dateRange.from, 'dd/MM/yyyy')}</>
                            )
                        ) : "Selecione um período"}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                    {/* Preset Selector */}
                    <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-neutral-900 border-neutral-600 text-white">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Últimos 7 dias</SelectItem>
                            <SelectItem value="15">Últimos 15 dias</SelectItem>
                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Native Date Picker Inputs */}
                    {period === 'custom' && (
                        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-600 rounded-md px-3 py-2">
                            <input
                                type="date"
                                className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                                value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                    const date = e.target.value ? parseISO(e.target.value) : undefined;
                                    setDateRange(prev => ({ ...prev, from: date }));
                                }}
                            />
                            <span className="text-neutral-500">-</span>
                            <input
                                type="date"
                                className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                                value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                    const date = e.target.value ? parseISO(e.target.value) : undefined;
                                    setDateRange(prev => ({ ...prev, to: date }));
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Cards (Restored) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white">Faturamento Bruto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {formatCurrency(totalRevenue)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white">Custo Total (CMV)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            - {formatCurrency(totalCost)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-800 border-neutral-700 border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white">Lucro Líquido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {formatCurrency(totalNetProfit)}
                        </div>
                        <p className="text-xs text-white mt-1">Margem: {margin.toFixed(1)}%</p>
                    </CardContent>
                </Card>
            </div>


            {/* Chart */}
            <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                    <CardTitle className="text-neutral-200">Evolução de Vendas vs Lucro</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#888" tickLine={false} axisLine={false} />
                            <YAxis stroke="#888" tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: any) => formatCurrency(value)}
                            />
                            <Legend />
                            <Bar dataKey="sales" name="Vendas Brutal" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Lucro Líquido" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top 10 Global */}
                <Card className="bg-neutral-800 border-neutral-700 md:col-span-1 border-l-4 border-l-yellow-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-500">
                            <Award className="w-5 h-5" /> Top 10 Global
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {top10Global.map((p, i) => (
                                <li key={i} className="flex justify-between items-center border-b border-neutral-700 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs ${i < 3 ? 'bg-yellow-500 text-black' : 'bg-neutral-700 text-neutral-400'}`}>
                                            {i + 1}
                                        </span>
                                        <span className="text-sm font-medium text-neutral-200 line-clamp-1">{p.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-neutral-400">{p.quantity} un</span>
                                </li>
                            ))}
                            {top10Global.length === 0 && <p className="text-neutral-500 text-center">Sem dados no período.</p>}
                        </ul>
                    </CardContent>
                </Card>

                {/* Top Categories */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(topByCategory).map(([category, items]) => (
                        <Card key={category} className="bg-neutral-800 border-neutral-700 h-fit">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm text-neutral-400 uppercase tracking-wider font-bold">{category}</CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                                <ul className="space-y-2">
                                    {items.map((p, i) => (
                                        <li key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-neutral-300 truncate max-w-[70%]">{i + 1}. {p.name}</span>
                                            <span className="text-neutral-500 font-mono">{p.quantity} un</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
