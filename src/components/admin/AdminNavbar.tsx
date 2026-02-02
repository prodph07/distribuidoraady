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
    Grid
} from "lucide-react";

interface AdminNavbarProps {
    mainSection: string;
    setMainSection: (section: any) => void;
}

export function AdminNavbar({ mainSection, setMainSection }: AdminNavbarProps) {

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
        <nav className="flex items-center gap-1 bg-neutral-900/50 p-1 rounded-lg border border-neutral-700/50 overflow-x-auto">
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
        </nav>
    );
}
