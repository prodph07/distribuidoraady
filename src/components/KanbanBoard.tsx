import { AdminOrderCard } from "./AdminOrderCard";
import { Order } from "@/types";

interface KanbanBoardProps {
    orders: Order[];
    onUpdateStatus: (id: string, status: string) => void;
}

export function KanbanBoard({ orders, onUpdateStatus }: KanbanBoardProps) {
    const columns = [
        { id: "pending_payment", title: "Pendentes", color: "bg-yellow-500/10 border-yellow-500/50 text-yellow-500", statusFilter: ["pending_payment"] },
        { id: "preparing", title: "Preparando", color: "bg-blue-500/10 border-blue-500/50 text-blue-500", statusFilter: ["preparing"] },
        { id: "out_for_delivery", title: "Em Entrega", color: "bg-orange-500/10 border-orange-500/50 text-orange-500", statusFilter: ["out_for_delivery"] },
        { id: "delivered", title: "Concluídos", color: "bg-green-500/10 border-green-500/50 text-green-500", statusFilter: ["delivered"] }
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
            {columns.map((col) => {
                const columnOrders = orders.filter(o => col.statusFilter.includes(o.status));

                return (
                    <div key={col.id} className="min-w-[300px] md:min-w-[350px] lg:min-w-[400px] flex-1 flex flex-col bg-neutral-800/50 rounded-xl border border-neutral-700/50 shrink-0">
                        {/* Column Header */}
                        <div className={`p-4 border-b border-neutral-700 flex justify-between items-center rounded-t-xl ${col.color}`}>
                            <h3 className="font-bold uppercase tracking-wider text-sm">{col.title}</h3>
                            <span className="bg-neutral-900/50 px-2 py-0.5 rounded text-xs font-mono">
                                {columnOrders.length}
                            </span>
                        </div>

                        {/* Column Content */}
                        <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {columnOrders.length === 0 ? (
                                <div className="text-center py-10 opacity-30 text-sm border-2 border-dashed border-neutral-700 rounded-lg">
                                    Vazio
                                </div>
                            ) : (
                                columnOrders.map(order => (
                                    <AdminOrderCard
                                        key={order.id}
                                        order={order}
                                        onUpdateStatus={onUpdateStatus}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
