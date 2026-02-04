"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { format, subDays, parseISO, isSameDay, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { TrendingUp, Award, Users, ShoppingCart, MousePointerClick, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DateRange = {
    from: Date | undefined;
    to: Date | undefined;
};

export function AnalyticsDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [events, setEvents] = useState<any[]>([]);
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

        // 1. Fetch Orders (Financials)
        const { data: ordersData } = await supabase
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

        // 2. Fetch Analytics Events (Traffic/Conversion)
        const { data: eventsData } = await supabase
            .from('analytics_events')
            .select('*')
            .gte('created_at', from)
            .lte('created_at', to);

        if (ordersData) setOrders(ordersData as any);
        if (eventsData) setEvents(eventsData);

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

    // --- Data Processing (Financials) ---
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

    // --- Data Processing (Funnel) ---

    // Unique Sessions (Visits)
    const uniqueSessions = new Set(events.map(e => e.session_id)).size;

    // Sessions with at least one 'add_to_cart'
    const sessionsWithCart = new Set(events.filter(e => e.event_type === 'add_to_cart').map(e => e.session_id));

    // Sessions with 'order_complete' OR linked to an order (proxy via analytics events logic)
    // Ideally we look for 'order_complete' event.
    const sessionsWithOrder = new Set(events.filter(e => e.event_type === 'order_complete').map(e => e.session_id));

    // Abandoned Carts: Sessions that added to cart but didn't complete order
    const abandonedCartsCount = [...sessionsWithCart].filter(sid => !sessionsWithOrder.has(sid)).length;

    // Conversion Rate: Orders / Unique Visits
    const conversionRate = uniqueSessions > 0 ? (sessionsWithOrder.size / uniqueSessions) * 100 : 0;

    // Cart Abandonment Rate
    const cartAbandonmentRate = sessionsWithCart.size > 0 ? (abandonedCartsCount / sessionsWithCart.size) * 100 : 0;


    // --- Charts Logic ---
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

    // Top Products
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

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Filter */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-neutral-900/50 p-6 rounded-3xl border border-neutral-800 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 text-white tracking-tight">
                        <TrendingUp className="text-primary w-6 h-6" /> Analytics e Performance
                    </h2>
                    <p className="text-neutral-400 mt-1">
                        Acompanhe o tráfego, conversão e faturamento da sua loja.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                        <SelectTrigger className="w-full sm:w-[200px] h-11 bg-neutral-950 border-neutral-800 text-neutral-200 rounded-xl font-medium">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Últimos 7 dias</SelectItem>
                            <SelectItem value="15">Últimos 15 dias</SelectItem>
                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                    </Select>

                    {period === 'custom' && (
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 h-11">
                            <input
                                type="date"
                                className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                                value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                    const date = e.target.value ? parseISO(e.target.value) : undefined;
                                    setDateRange(prev => ({ ...prev, from: date }));
                                }}
                            />
                            <span className="text-neutral-600">→</span>
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

            {/* FUNNEL METRICS (NEW) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-neutral-900 border-neutral-800 shadow-lg hover:border-neutral-700 transition-colors group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Visitas Totais</CardTitle>
                        <Users className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white">{uniqueSessions}</div>
                        <p className="text-xs text-neutral-500 mt-1">Sessões únicas visualizadas</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800 shadow-lg hover:border-neutral-700 transition-colors group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Carrinhos Criados</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white">{sessionsWithCart.size}</div>
                        <p className="text-xs text-neutral-500 mt-1">Clientes com intenção de compra</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800 shadow-lg hover:border-neutral-700 transition-colors group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Carrinhos Abandonados</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-400">{abandonedCartsCount}</div>
                        <p className="text-xs text-red-500/50 mt-1">{cartAbandonmentRate.toFixed(1)}% de desistência</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800 shadow-lg hover:border-neutral-700 transition-colors group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Conversão em Vendas</CardTitle>
                        <Award className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-green-400">{conversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-green-500/50 mt-1">Visitantes que compraram</p>
                    </CardContent>
                </Card>
            </div>

            {/* FINANCIAL METRICS (OLD BUT POLISHED) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider font-bold text-neutral-500">Faturamento Bruto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {formatCurrency(totalRevenue)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider font-bold text-neutral-500">Lucro Líquido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500 tracking-tight">
                            {formatCurrency(totalNetProfit)}
                        </div>
                        <p className="text-xs text-green-500/80 mt-2 font-mono bg-green-950/30 w-fit px-2 py-1 rounded">
                            Margem: {margin.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider font-bold text-neutral-500">Ticket Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {orders.length > 0 ? formatCurrency(totalRevenue / orders.length) : 'R$ 0,00'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <Card className="bg-neutral-900 border-neutral-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-neutral-200">Evolução Diária</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#525252"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="#525252"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `R$${val}`}
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="sales" name="Vendas Totais" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="profit" name="Lucro Real" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="bg-neutral-900 border-neutral-800 lg:col-span-1 flex flex-col">
                    <CardHeader className="border-b border-neutral-800/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Award className="w-5 h-5 text-yellow-500" /> Mais Vendidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pr-2 pt-6 custom-scrollbar">
                        <div className="space-y-4">
                            {top10Global.map((p, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0
                                        ${i === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' :
                                            i === 1 ? 'bg-neutral-300 text-black' :
                                                i === 2 ? 'bg-orange-700 text-white' : 'bg-neutral-800 text-neutral-500'}
                                    `}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm truncate group-hover:text-primary transition-colors">{p.name}</p>
                                        <p className="text-xs text-neutral-500">{p.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-white text-sm">{p.quantity} un</span>
                                    </div>
                                </div>
                            ))}
                            {top10Global.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2 py-10">
                                    <ShoppingCart className="w-8 h-8 opacity-20" />
                                    <p className="text-sm">Sem dados de vendas</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Add CSS for custom scrollbar if needed or rely on globals

