"use client";

import { useEffect, useState } from "react";
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
    ResponsiveContainer
} from 'recharts';
import { format, subDays, parseISO, isSameDay, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, DollarSign, CheckCircle, TrendingUp, AlertCircle, Filter, ArrowUpRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DateRange = {
    from: Date | undefined;
    to: Date | undefined;
};

type DailyFinance = {
    date: string;
    fullDate: Date;
    totalRevenue: number;
    totalFees: number;
    isPaid: boolean;
};

export function FinancialDashboard() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7' | '15' | '30' | 'custom'>('15');
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 15),
        to: new Date(),
    });
    const [dailyData, setDailyData] = useState<DailyFinance[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);

    const fetchFinancialData = async () => {
        if (!dateRange?.from) return;

        setLoading(true);
        const from = startOfDay(dateRange.from).toISOString();
        const to = endOfDay(dateRange.to || dateRange.from || new Date()).toISOString();

        // 1. Fetch Orders with Fees
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('created_at, total_amount, service_fee')
            .in('status', ['delivered'])
            .gte('created_at', from)
            .lte('created_at', to)
            .order('created_at', { ascending: true });

        if (ordersError) console.error("Error fetching orders:", ordersError);

        // 2. Fetch Payouts
        const { data: paidDays, error: payoutsError } = await supabase
            .from('commission_payouts')
            .select('*')
            .gte('reference_date', format(dateRange.from, 'yyyy-MM-dd'))
            .lte('reference_date', format(dateRange.to || new Date(), 'yyyy-MM-dd'));

        if (payoutsError) console.error("Error fetching payouts:", payoutsError);

        // 3. Process Data
        const daysDiff = dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) + 1 : parseInt(period);
        const chartDays = Math.max(daysDiff || 1, 1);

        const processedData: DailyFinance[] = [];

        for (let i = 0; i < chartDays; i++) {
            const d = subDays(dateRange?.to || new Date(), chartDays - 1 - i);
            const dateStr = format(d, 'yyyy-MM-dd');

            // Filter orders for this day
            const dayOrders = orders?.filter(o => isSameDay(parseISO(o.created_at), d)) || [];

            // Calculate totals
            const revenue = dayOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
            const fees = dayOrders.reduce((acc, o) => acc + (Number(o.service_fee) || 0), 0);

            // Check if paid
            const isPaid = paidDays?.some(p => p.reference_date === dateStr);

            processedData.push({
                date: format(d, 'dd/MM'),
                fullDate: d,
                totalRevenue: revenue,
                totalFees: fees,
                isPaid: !!isPaid
            });
        }

        setDailyData(processedData);
        setPayouts(paidDays || []);
        setLoading(false);
    };

    const handleMarkAsPaid = async (day: DailyFinance) => {
        if (day.totalFees <= 0 || day.isPaid) return;

        const confirm = window.confirm(`Confirmar pagamento das taxas de ${day.date} no valor de ${formatCurrency(day.totalFees)}?`);
        if (!confirm) return;

        const dateStr = format(day.fullDate, 'yyyy-MM-dd');

        const { error } = await supabase.from('commission_payouts').insert({
            reference_date: dateStr,
            amount: day.totalFees,
            status: 'paid'
        });

        if (error) {
            alert('Erro ao registrar pagamento.');
            console.error(error);
        } else {
            fetchFinancialData(); // Refresh
        }
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
            fetchFinancialData();
        }
    }, [dateRange]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Totals
    const totalFeesPeriod = dailyData.reduce((acc, d) => acc + d.totalFees, 0);
    const totalPending = dailyData.filter(d => !d.isPaid).reduce((acc, d) => acc + d.totalFees, 0);
    const totalPaid = dailyData.filter(d => d.isPaid).reduce((acc, d) => acc + d.totalFees, 0);

    return (
        <div className="space-y-6">
            {/* Header / Filter */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <DollarSign className="text-green-500" /> Painel de Comissões
                    </h2>
                    <p className="text-sm text-neutral-400">Gerencie seus lucros provenientes da Taxa de Serviço.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total em Taxas (Período)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{formatCurrency(totalFeesPeriod)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-800 border-neutral-700 border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Já Pago / Retirado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">{formatCurrency(totalPaid)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-800 border-neutral-700 border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Pendente de Retirada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{formatCurrency(totalPending)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left: Chart */}
                <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                        <CardTitle className="text-neutral-200 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" /> Evolução de Taxas
                        </CardTitle>
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
                                    formatter={(value: any) => [formatCurrency(value), "Comissões"]}
                                />
                                <Legend />
                                <Bar dataKey="totalFees" name="Comissões" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Right: Daily List & Actions */}
                <Card className="bg-neutral-800 border-neutral-700 flex flex-col h-[500px]">
                    <CardHeader className="pb-4 border-b border-neutral-700">
                        <CardTitle className="text-neutral-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-gray-400" /> Baixa de Comissões
                            </div>
                            <span className="text-xs font-normal text-neutral-500 bg-neutral-900 px-2 py-1 rounded-full">
                                {dailyData.filter(d => d.totalFees > 0 && !d.isPaid).length} dias pendentes
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        <div className="divide-y divide-neutral-700">
                            {[...dailyData].reverse().map((day) => (
                                <div key={day.date} className="flex items-center justify-between p-4 hover:bg-neutral-700/30 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white">{day.date}</span>
                                        <span className="text-xs text-neutral-500">{format(day.fullDate, 'EEEE', { locale: ptBR })}</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-bold text-white">{formatCurrency(day.totalFees)}</div>
                                            <div className="text-xs text-neutral-500">em {day.totalRevenue > 0 ? 'vendas' : 'taxas'}</div>
                                        </div>

                                        {day.totalFees > 0 ? (
                                            day.isPaid ? (
                                                <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-md text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" /> Pago
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white"
                                                    onClick={() => handleMarkAsPaid(day)}
                                                >
                                                    Dar Baixa
                                                </Button>
                                            )
                                        ) : (
                                            <span className="text-neutral-600 text-sm italic px-4">—</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {dailyData.length === 0 && (
                                <div className="p-8 text-center text-neutral-500">
                                    Nenhum dado para o período selecionado.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
