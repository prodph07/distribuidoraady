"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import { DollarSign, Percent, Save, ArrowLeft, TrendingUp, Truck, Settings2 } from "lucide-react";
import Link from "next/link";

interface CommissionTier {
    max: number;
    percent: number;
}

export default function FinancialDashboard() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings State
    const [settingsId, setSettingsId] = useState<number | null>(null);
    const [commissionType, setCommissionType] = useState<"tiers" | "fixed">("tiers");
    const [fixedValue, setFixedValue] = useState("0.00");
    const [tiers, setTiers] = useState<CommissionTier[]>([
        { max: 50, percent: 10 },
        { max: 150, percent: 7 },
        { max: 999999, percent: 5 }
    ]);

    // Financial Report State (Only Commissions now)
    const [totalCommissions, setTotalCommissions] = useState(0);

    useEffect(() => {
        fetchSettings();
        fetchFinancialReport();
    }, []);

    const fetchSettings = async () => {
        const { data, error } = await supabase.from('settings').select('*').single();
        if (data) {
            setSettingsId(data.id);
            setCommissionType(data.commission_type || "tiers");
            setFixedValue(data.commission_fixed_value?.toString() || "0.00");
            if (data.commission_tiers) {
                setTiers(data.commission_tiers as CommissionTier[]);
            }
        }
        setLoading(false);
    };

    const fetchFinancialReport = async () => {
        const { data } = await supabase
            .from('orders')
            .select('service_fee')
            .neq('status', 'cancelled');

        if (data) {
            const comms = data.reduce((acc, curr) => acc + (curr.service_fee || 0), 0);
            setTotalCommissions(comms);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase.from('settings').update({
            commission_type: commissionType,
            commission_fixed_value: parseFloat(fixedValue),
            commission_tiers: tiers,
            updated_at: new Date()
        }).eq('id', settingsId);

        if (error) {
            alert("Erro ao salvar: " + error.message);
        } else {
            alert("Configurações salvas com sucesso!");
        }
        setSaving(false);
    };

    const updateTier = (index: number, field: keyof CommissionTier, value: string) => {
        const newTiers = [...tiers];
        newTiers[index] = {
            ...newTiers[index],
            [field]: Number(value)
        };
        setTiers(newTiers);
    };

    if (loading) return <div className="p-8 text-white">Carregando...</div>;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                            <ArrowLeft size={24} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-2">
                            <Settings2 className="w-8 h-8 text-yellow-500" />
                            Configuração de Comissões
                        </h1>
                        <p className="text-neutral-400">Defina como o sistema calcula o seu lucro (Taxa de Serviço).</p>
                    </div>
                </div>

                {/* KPI Card */}
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400 uppercase tracking-widest">
                            Total Acumulado em Comissões
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-green-400 flex items-center gap-2">
                            <TrendingUp className="w-8 h-8" />
                            R$ {totalCommissions.toFixed(2).replace('.', ',')}
                        </div>
                    </CardContent>
                </Card>

                {/* Commission Logic Config */}
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <DollarSign className="w-5 h-5 text-green-500" /> Regra de Cobrança
                        </CardTitle>
                        <CardDescription className="text-neutral-500">
                            Escolha como você quer cobrar sua taxa de serviço.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <RadioGroup
                            value={commissionType}
                            onValueChange={(v: "tiers" | "fixed") => setCommissionType(v)}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem value="tiers" id="tiers" className="peer sr-only" />
                                <Label
                                    htmlFor="tiers"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-neutral-700 bg-neutral-950 p-4 hover:bg-neutral-900 hover:text-white peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:text-green-500 cursor-pointer transition-all"
                                >
                                    <Percent className="mb-3 h-6 w-6" />
                                    Porcentagem por Faixa
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                                <Label
                                    htmlFor="fixed"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-neutral-700 bg-neutral-950 p-4 hover:bg-neutral-900 hover:text-white peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:text-green-500 cursor-pointer transition-all"
                                >
                                    <DollarSign className="mb-3 h-6 w-6" />
                                    Valor Fixo por Pedido
                                </Label>
                            </div>
                        </RadioGroup>

                        {/* Logic for Tiers */}
                        {commissionType === 'tiers' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-sm font-bold text-neutral-300 mb-4 uppercase">Configurar Faixas (%)</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-neutral-500 uppercase px-2">
                                        <div className="col-span-7">Até Valor do Carrinho (R$)</div>
                                        <div className="col-span-5 text-right">Sua Comissão (%)</div>
                                    </div>
                                    {tiers.map((tier, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                                            <div className="col-span-7 relative">
                                                <span className="absolute left-3 top-2.5 text-neutral-600 text-xs">Até R$</span>
                                                <Input
                                                    type="number"
                                                    value={tier.max}
                                                    onChange={e => updateTier(index, 'max', e.target.value)}
                                                    className="pl-12 bg-neutral-900 border-neutral-700 text-white"
                                                />
                                            </div>
                                            <div className="col-span-5 relative">
                                                <Input
                                                    type="number"
                                                    value={tier.percent}
                                                    onChange={e => updateTier(index, 'percent', e.target.value)}
                                                    className="bg-neutral-900 border-neutral-700 text-yellow-400 font-bold pr-8 text-right"
                                                />
                                                <span className="absolute right-3 top-2.5 text-neutral-500 font-bold">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Logic for Fixed */}
                        {commissionType === 'fixed' && (
                            <div className="animate-in fade-in slide-in-from-top-2 p-6 bg-neutral-950 rounded-lg border border-neutral-800">
                                <Label className="text-neutral-400 font-bold block mb-2">Valor da sua Comissão por Pedido</Label>
                                <div className="relative max-w-xs">
                                    <span className="absolute left-3 top-3 text-neutral-500 font-bold text-lg">R$</span>
                                    <Input
                                        type="number"
                                        step="0.50"
                                        value={fixedValue}
                                        onChange={e => setFixedValue(e.target.value)}
                                        className="pl-10 h-14 bg-neutral-900 border-neutral-700 text-white font-black text-2xl"
                                    />
                                </div>
                                <p className="text-sm text-neutral-500 mt-2">
                                    Independentemente do valor total do carrinho, você receberá exatamente este valor.
                                </p>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 shadow-lg shadow-green-900/20 w-full sm:w-auto"
                    >
                        {saving ? "Salvando..." : (
                            <>
                                <Save className="w-5 h-5 mr-2" /> Salvar Configuração
                            </>
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
}
