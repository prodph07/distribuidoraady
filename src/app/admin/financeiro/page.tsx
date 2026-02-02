"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Settings, PieChart } from "lucide-react";
import { FinancialDashboard } from "@/components/admin/FinancialDashboard";
import { FinancialSettings } from "@/components/admin/FinancialSettings";

export default function FinanceiroPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 pb-20">
            {/* Header */}
            <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/dashboard" className="text-neutral-400 hover:text-white transition-colors">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft size={18} />
                                Voltar
                            </Button>
                        </Link>

                        {/* Brand */}
                        <div className="flex items-center gap-3 border-l border-neutral-700 pl-6">
                            <div className="bg-primary p-2 rounded-lg text-black">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-none">Financeiro</h1>
                                <span className="text-xs text-neutral-400">Distribuidora Zé</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Switcher */}
                    <div className="bg-neutral-900 p-1 rounded-lg border border-neutral-700 flex items-center">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            <PieChart size={16} />
                            Painel
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            <Settings size={16} />
                            Configurar
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-6">
                {activeTab === 'dashboard' ? (
                    <FinancialDashboard />
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <FinancialSettings />
                    </div>
                )}
            </main>
        </div>
    );
}
