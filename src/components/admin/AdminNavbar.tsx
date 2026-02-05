"use client";

import { Button } from "@/components/ui/button";
import {
    ShoppingBag,
    Calendar as CalendarIcon,
    Database,
    Package,
    Truck,
    PieChart,
    Settings,
    Grid,
    Store,
    DoorClosed,
    DoorOpen
} from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface AdminNavbarProps {
    mainSection: string;
    setMainSection: (section: any) => void;
}

export function AdminNavbar({ mainSection, setMainSection }: AdminNavbarProps) {
    const { isOpen, toggleStoreStatus, loading } = useStoreSettings();

    const navItems = [
        { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
        { id: 'history', label: 'Histórico', icon: CalendarIcon },
        { id: 'stock', label: 'Estoque', icon: Database },
        { id: 'combos', label: 'Combos', icon: Package },
        { id: 'couriers', label: 'Motoboys', icon: Truck },
        { id: 'analytics', label: 'Relatórios', icon: PieChart },
        { id: 'settings', label: 'Config', icon: Settings },
        { id: 'home-config', label: 'Vitrine', icon: Grid },
    ];

    return (
        <nav className="flex items-center justify-between bg-neutral-900/50 p-1 rounded-lg border border-neutral-700/50">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = mainSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setMainSection(item.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${isActive
                                ? 'bg-neutral-700 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                }`}
                        >
                            <Icon size={16} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="pl-2 border-l border-neutral-700/50 ml-2">
                <button
                    onClick={toggleStoreStatus}
                    disabled={loading}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${isOpen
                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                        }`}
                >
                    {isOpen ? <DoorOpen size={16} /> : <DoorClosed size={16} />}
                    <span>{isOpen ? 'LOJA ABERTA' : 'LOJA FECHADA'}</span>
                </button>
            </div>
        </nav>
    );
}
