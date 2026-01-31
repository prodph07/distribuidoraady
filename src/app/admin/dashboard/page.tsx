"use client";


import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { AdminOrderCard } from "@/components/AdminOrderCard";
import { Switch } from "@/components/ui/switch";
import { Product, Order, Category, Subcategory } from "@/types";
import { supabase } from "@/lib/supabase";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Database, TrendingUp, ShoppingBag, DollarSign, Bell, BellOff, AlignJustify, Grid, Settings, Plus, Trash2, Minus, Pencil, Truck, PieChart, MapPin, AlertTriangle, Search, CreditCard, Wallet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { KanbanBoard } from "@/components/KanbanBoard";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { HomeConfigTab } from "@/components/admin/HomeConfigTab";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [stockSearch, setStockSearch] = useState("");
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isReturnable, setIsReturnable] = useState(false);

    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [realtimeStatus, setRealtimeStatus] = useState<string>("Conectando...");
    const [audioLocked, setAudioLocked] = useState(true); // Default to true to force initial interaction
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [mainSection, setMainSection] = useState<'orders' | 'stock' | 'couriers' | 'analytics' | 'settings' | 'home-config'>('orders');
    const [couriers, setCouriers] = useState<any[]>([]);
    const [showStockAlert, setShowStockAlert] = useState(true);

    // Stripe Logic Removed
    const [stripeConnected, setStripeConnected] = useState(false); // Kept locally to avoid breaking render if referenced elsewhere, but unused.
    // Actually better to fully remove.

    // STates for Fees
    const [deliveryFee, setDeliveryFee] = useState("5.00");
    const [settingsId, setSettingsId] = useState<number | null>(null);

    // KPI Filters
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0);
    const totalOrdersCount = orders.length; // Total orders in system (or maybe just today? keeping it simple as per original)
    const avgTicket = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    // Calculate Total Net Profit (Realtime)
    const totalCost = deliveredOrders.reduce((acc, order) => {
        const orderCost = order.order_items?.reduce((sum: number, item: any) => {
            const p = item.products;
            if (!p) return sum;

            const liquidCost = (p.cost_price || 0);
            const bottleCost = !item.is_exchange ? (p.bottle_cost || 0) : 0;
            return sum + ((liquidCost + bottleCost) * item.quantity);
        }, 0) || 0;
        return acc + orderCost;
    }, 0);

    const totalNetProfit = totalRevenue - totalCost;

    const playNotificationSound = async () => {
        if (!audioRef.current || !soundEnabled) return;

        try {
            await audioRef.current.play();
            setAudioLocked(false);
        } catch (error: any) {
            console.warn("Audio Auto-play blocked (Waiting for interaction):", error);
            if (error.name === "NotAllowedError") {
                setAudioLocked(true);
            }
        }
    };

    const unlockAudio = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                audioRef.current!.currentTime = 0;
                setAudioLocked(false);
            });
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchProducts();
        fetchCategories();

        // Init Audio
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        // Realtime Subscription (Broad Listener)
        const channel = supabase
            .channel('realtime-orders')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                console.log('📡 EVENTO REALTIME RECEBIDO:', payload);

                // If it's related to orders or products, refresh
                if (payload.table === 'orders' || payload.table === 'products') {
                    if (payload.eventType === 'INSERT' && payload.table === 'orders') {
                        // alert("Novo pedido recebido!"); // Removed alert to rely on sound/UI
                        playNotificationSound();
                    }

                    if (payload.table === 'orders') fetchOrders();
                    if (payload.table === 'products') fetchProducts();
                }
            })
            .subscribe((status) => {
                console.log("📡 STATUS REALTIME:", status);
                setRealtimeStatus(status);
            });

        return () => {
            console.log("Supabase Channel Cleanup");
            supabase.removeChannel(channel);
        };
        const fetchSettings = async () => {
            const { data } = await supabase.from('settings').select('*').single();
            if (data) {
                setDeliveryFee(data.delivery_fee.toString());
                setSettingsId(data.id);
            }
        };

        fetchSettings();
    }, []); // Removed soundEnabled dependency to avoid re-subscribing, handled in ref

    const fetchProducts = async () => {
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (data) setProducts(data);
    };

    const fetchCategories = async () => {
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        if (cats) setCategories(cats);

        const { data: subcats } = await supabase.from('subcategories').select('*').order('name');
        if (subcats) setSubcategories(subcats);
    };

    const fetchOrders = async () => {
        // Fetch orders with items and product costs
        const { data: ordersData } = await supabase
            .from('orders')
            .select(`
            *,
            order_items (
                quantity,
                is_exchange,
                products ( name, cost_price, bottle_cost, deposit_price )
            )
        `)
            .order('created_at', { ascending: false });

        if (ordersData) {
            setOrders(ordersData as any);
        }
    };

    const fetchCouriers = async () => {
        const { data } = await supabase.from('couriers').select('*').order('name');
        if (data) setCouriers(data);
    };

    useEffect(() => {
        if (mainSection === 'couriers') fetchCouriers();
    }, [mainSection]);

    const toggleStock = async (id: number, currentStatus: boolean) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock: !currentStatus } : p));
        const { error } = await supabase.from('products').update({ in_stock: !currentStatus }).eq('id', id);
        if (error) {
            console.error("Error updating stock", error);
            fetchProducts();
        }
    };

    const updateOrderStatus = async (id: string, newStatus: string) => {
        // Optimistic Update
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

        try {
            const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            // Success audio (optional)
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Erro ao atualizar status do pedido.");
            fetchOrders(); // Revert
        }
    };

    // --- Stock Management ---

    const updateStockQuantity = async (id: number, delta: number) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        const newQuantity = (product.stock_quantity || 0) + delta;
        if (newQuantity < 0) return;

        // Optimistic
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_quantity: newQuantity } : p));

        const { error } = await supabase.from('products').update({ stock_quantity: newQuantity }).eq('id', id);
        if (error) {
            console.error("Error updating quantity", error);
            fetchProducts();
        }
    };

    const deleteProduct = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este produto?")) return;

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            console.error("Error deleting product", error);
            alert("Erro ao excluir produto.");
        } else {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const price = parseFloat(formData.get('price') as string);
        const stock_quantity = parseInt(formData.get('stock_quantity') as string) || 0;
        const category = formData.get('category') as string || null;
        const subcategory = formData.get('subcategory') as string || null;
        const cost_price = parseFloat(formData.get('cost_price') as string) || 0;
        const deposit_price = parseFloat(formData.get('deposit_price') as string) || 0;
        const bottle_cost = parseFloat(formData.get('bottle_cost') as string) || 0;
        const is_returnable = formData.get('is_returnable') === 'on';
        const image_url = formData.get('image_url') as string || 'https://images.unsplash.com/photo-1606168094136-e8c8c6383307?q=80&w=2670&auto=format&fit=crop';

        const productData = {
            name,
            price,
            stock_quantity,
            category,
            subcategory,
            cost_price,
            bottle_cost,
            deposit_price,
            image_url,
            is_returnable,
            in_stock: true
        };

        let result;
        if (editingProduct) {
            result = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        } else {
            result = await supabase.from('products').insert(productData);
        }

        const { error } = result;

        if (error) {
            alert("Erro ao salvar: " + error.message);
        } else {
            fetchProducts();
            setIsProductModalOpen(false);
            setEditingProduct(null);
            alert(editingProduct ? "Produto atualizado!" : "Produto adicionado!");
        }
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsReturnable(product.is_returnable || false);
        setIsProductModalOpen(true);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setIsReturnable(false);
        setIsProductModalOpen(true);
    }

    const handleSeed = async () => {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
        if (count && count > 0) {
            alert("Banco de dados já contem produtos!");
            return;
        }
        const { error } = await supabase.from('products').insert(
            MOCK_PRODUCTS.map(({ id, ...p }) => p)
        );
        if (error) alert("Erro ao semear banco: " + error.message);
        else {
            alert("Produtos inseridos com sucesso!");
            fetchProducts();
        }
    }

    // Filter Logic
    const pendingOrders = orders.filter(o => ['pending_payment', 'preparing'].includes(o.status));
    const deliveryOrders = orders.filter(o => o.status === 'out_for_delivery');
    const completedOrders = orders.filter(o => o.status === 'delivered');

    const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('cat_name') as string;
        if (!name) return;
        await supabase.from('categories').insert({ name });
        fetchCategories();
        (e.target as HTMLFormElement).reset();
    };

    const handleAddSubcategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('sub_name') as string;
        const category_id = formData.get('cat_id') as string;
        if (!name || !category_id) return;
        await supabase.from('subcategories').insert({ name, category_id: parseInt(category_id) });
        fetchCategories();
        (e.target as HTMLFormElement).reset();
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Excluir categoria? Isso pode afetar subcategorias.")) return;
        await supabase.from('categories').delete().eq('id', id);
        fetchCategories();
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 pb-20">
            {/* Top Bar */}
            {/* Top Bar / Navbar */}
            <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-lg text-black">
                                <TrendingUp size={24} />
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-xl font-bold leading-none">Torre de Controle</h1>
                                <span className="text-xs text-neutral-400">Distribuidora Zé</span>
                            </div>
                        </div>

                        {/* Main Navigation */}
                        <nav className="flex items-center gap-1 bg-neutral-900/50 p-1 rounded-lg border border-neutral-700/50">
                            <button
                                onClick={() => setMainSection('orders')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mainSection === 'orders'
                                    ? 'bg-neutral-700 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <ShoppingBag size={16} />
                                    <span>Pedidos</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setMainSection('stock')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mainSection === 'stock'
                                    ? 'bg-neutral-700 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Database size={16} />
                                    <span>Estoque</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setMainSection('couriers')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mainSection === 'couriers'
                                    ? 'bg-neutral-700 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Truck size={16} />
                                    <span>Motoboys</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setMainSection('analytics')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mainSection === 'analytics'
                                    ? 'bg-neutral-700 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <PieChart size={16} />
                                    <span>Relatórios</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setMainSection('settings')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mainSection === 'settings'
                                    ? 'bg-neutral-700 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Settings size={16} />
                                    <span>Config</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setMainSection('home-config')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mainSection === 'home-config'
                                    ? 'bg-neutral-700 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Grid size={16} />
                                    <span>Vitrine</span>
                                </div>
                            </button>
                            {/* Financial Link Removed from Sidebar - Moved to Settings Tab */}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {audioLocked && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={unlockAudio}
                                className="animate-pulse font-bold"
                            >
                                🔊 Ativar Som
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSoundEnabled(!soundEnabled);
                                if (!soundEnabled && audioLocked) unlockAudio();
                            }}
                            className={soundEnabled ? "text-green-400" : "text-neutral-500"}
                            title="Som de Notificação"
                        >
                            {soundEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSeed} className="border-neutral-600 hover:bg-neutral-700 text-neutral-300 hidden sm:flex">
                            <Database className="w-4 h-4 mr-2" /> Seed DB
                        </Button>
                        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <span className="relative flex h-2 w-2">
                                {realtimeStatus === 'SUBSCRIBED' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-wider ${realtimeStatus === 'SUBSCRIBED' ? 'text-green-400' : 'text-red-400'}`}>
                                {realtimeStatus === 'SUBSCRIBED' ? 'ONLINE' : realtimeStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </header >

            {/* Audio Unlock Overlay */}
            {
                audioLocked && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
                        onClick={unlockAudio}
                    >
                        <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 text-center space-y-4 max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <span className="text-4xl">🔊</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Clique para Ativar o Som</h2>
                            <p className="text-neutral-400">
                                O navegador bloqueou o áudio automático. Clique em qualquer lugar para autorizar os alertas sonoros de novos pedidos.
                            </p>
                            <Button className="w-full font-bold text-lg bg-primary text-black hover:bg-yellow-400 mt-4">
                                ATIVAR MONITORAMENTO
                            </Button>
                        </div>
                    </div>
                )
            }

            <main className="container mx-auto p-6 space-y-8">

                {/* KPIs */}
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

                {/* Main Content: Orders & Stock */}

                {/* MAIN SECTION: ORDERS */}
                {mainSection === 'orders' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ShoppingBag className="text-primary" /> Quadro de Pedidos
                            </h2>
                            {/* Removed List/Kanban Toggle as per request */}
                        </div>

                        <KanbanBoard orders={orders} onUpdateStatus={updateOrderStatus} />
                    </div>
                )}

                {mainSection === 'stock' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
                            <div className="mb-6 space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Database className="w-6 h-6 text-primary" /> Gerenciamento de Estoque
                                    </h2>

                                    {/* Manage Categories Modal Trigger */}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="border-neutral-700 hover:bg-neutral-800">
                                                <Settings className="w-4 h-4 mr-2" /> Gerenciar Categorias
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Gerenciar Categorias e Subcategorias</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid md:grid-cols-2 gap-8 mt-4">
                                                {/* Categories Column */}
                                                <div>
                                                    <h3 className="font-bold mb-3 text-primary">Categorias</h3>
                                                    <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                                                        <Input name="cat_name" placeholder="Nova Categoria" className="bg-neutral-800 border-neutral-700 h-8" required />
                                                        <Button type="submit" size="sm" className="bg-primary text-black hover:bg-yellow-500">+</Button>
                                                    </form>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                                        {categories.map(c => (
                                                            <div key={c.id} className="flex justify-between items-center bg-neutral-950 p-2 rounded border border-neutral-800">
                                                                <span>{c.name}</span>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-neutral-900" onClick={() => handleDeleteCategory(c.id)}><Trash2 size={12} /></Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Subcategories Column */}
                                                <div>
                                                    <h3 className="font-bold mb-3 text-neutral-300">Subcategorias</h3>
                                                    <form onSubmit={handleAddSubcategory} className="space-y-2 mb-4">
                                                        <select name="cat_id" className="w-full bg-neutral-800 border border-neutral-700 rounded p-1 text-sm text-white" required>
                                                            <option value="">Selecione a Categoria Pai...</option>
                                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                        </select>
                                                        <div className="flex gap-2">
                                                            <Input name="sub_name" placeholder="Nova Subcategoria" className="bg-neutral-800 border-neutral-700 h-8" required />
                                                            <Button type="submit" size="sm" className="bg-neutral-700 hover:bg-neutral-600">+</Button>
                                                        </div>
                                                    </form>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                                        {subcategories.map(sc => {
                                                            const parent = categories.find(c => c.name === selectedCategory);
                                                            return (
                                                                <div key={sc.id} className="flex justify-between items-center bg-neutral-950 p-2 rounded border border-neutral-800">
                                                                    <div className="flex flex-col">
                                                                        <span>{sc.name}</span>
                                                                        <span className="text-[10px] text-neutral-500">{parent?.name}</span>
                                                                    </div>
                                                                    {/* Add delete logic for subcategory later if needed */}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                                    <Input
                                        placeholder="Buscar produtos no estoque..."
                                        className="pl-9 bg-neutral-900 border-neutral-700"
                                        value={stockSearch}
                                        onChange={(e) => setStockSearch(e.target.value)}
                                    />
                                </div>

                                {/* Category Filters (Wrapped) */}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={selectedCategory === 'Todas' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setSelectedCategory('Todas');
                                            setSelectedSubcategory(null);
                                        }}
                                        className={selectedCategory === 'Todas' ? "bg-primary text-black hover:bg-yellow-500" : "border-neutral-600 text-neutral-400"}
                                    >
                                        Todas
                                    </Button>
                                    {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                                        <Button
                                            key={cat}
                                            variant={selectedCategory === cat ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                setSelectedCategory(cat as string);
                                                setSelectedSubcategory(null);
                                            }}
                                            className={selectedCategory === cat ? "bg-primary text-black hover:bg-yellow-500" : "border-neutral-600 text-neutral-400"}
                                        >
                                            {cat}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Subfilters */}
                            {selectedCategory !== 'Todas' && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <div className="text-sm text-neutral-500 flex items-center mr-2">Filtros:</div>
                                    <button
                                        onClick={() => setSelectedSubcategory(null)}
                                        className={`px-3 py-1 border rounded-full text-xs transition-colors ${selectedSubcategory === null ? "bg-white text-black border-white font-bold" : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600"}`}
                                    >
                                        Todos
                                    </button>
                                    {subcategories
                                        .filter(sc => {
                                            const parent = categories.find(c => c.name === selectedCategory);
                                            return parent && sc.category_id === parent.id;
                                        })
                                        .map(sc => (
                                            <button
                                                key={sc.id}
                                                onClick={() => setSelectedSubcategory(selectedSubcategory === sc.name ? null : sc.name)}
                                                className={`px-3 py-1 border rounded-full text-xs transition-colors ${selectedSubcategory === sc.name ? "bg-white text-black border-white font-bold" : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600"}`}
                                            >
                                                {sc.name}
                                            </button>
                                        ))
                                    }
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {products.filter(p => {
                                    if (stockSearch && !p.name.toLowerCase().includes(stockSearch.toLowerCase())) return false;
                                    if (selectedCategory !== 'Todas' && p.category !== selectedCategory) return false;
                                    if (selectedSubcategory && p.subcategory !== selectedSubcategory) return false;
                                    return true;
                                }).map(product => (
                                    <div key={product.id} className="flex flex-col p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className={`font-medium block ${product.in_stock ? "text-neutral-200" : "text-neutral-500 line-through"}`}>
                                                    {product.name}
                                                </span>
                                                {product.category && (
                                                    <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded">
                                                        {product.category} {product.subcategory && `• ${product.subcategory}`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id={`stock-${product.id}`}
                                                    checked={product.in_stock}
                                                    onCheckedChange={() => toggleStock(product.id, product.in_stock)}
                                                    className="data-[state=unchecked]:bg-neutral-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mb-4 bg-neutral-950/50 p-2 rounded-lg">
                                            <span className="text-xs text-neutral-400 font-bold uppercase">Estoque</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateStockQuantity(product.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="font-mono font-bold text-lg min-w-[20px] text-center">{product.stock_quantity || 0}</span>
                                                <button
                                                    onClick={() => updateStockQuantity(product.id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-2 border-t border-neutral-800 text-xs text-neutral-500 flex justify-between items-center">
                                            <div>
                                                <span className="font-semibold text-neutral-300 block">R$ {product.price.toFixed(2)}</span>
                                                {(product.cost_price || 0) > 0 && !product.is_returnable && (
                                                    <span className={`text-[10px] font-bold block ${(product.price - (product.cost_price || 0)) > 0 ? "text-green-500" : "text-red-500"}`}>
                                                        Lucro: R$ {(product.price - (product.cost_price || 0)).toFixed(2)}
                                                    </span>
                                                )}

                                                {product.is_returnable && (
                                                    <div className="flex flex-col mt-1 space-y-0.5">
                                                        {/* Refill Profit */}
                                                        <span className={`text-[10px] font-bold block bg-neutral-800 px-1 rounded ${(product.price - (product.cost_price || 0)) > 0 ? "text-green-400" : "text-red-400"}`}>
                                                            Líq: R$ {(product.price - (product.cost_price || 0)).toFixed(2)}
                                                        </span>
                                                        {/* Full Profit (Liquid + Bottle - Costs) */}
                                                        {(product.bottle_cost || 0) > 0 && (
                                                            <span className={`text-[10px] font-bold block bg-neutral-800 px-1 rounded ${((product.price + (product.deposit_price || 0)) - ((product.cost_price || 0) + (product.bottle_cost || 0))) > 0 ? "text-green-400" : "text-red-400"}`}>
                                                                Cheio: R$ {((product.price + (product.deposit_price || 0)) - ((product.cost_price || 0) + (product.bottle_cost || 0))).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-neutral-400 hover:text-white hover:bg-neutral-800"
                                                    onClick={() => openEditModal(product)}
                                                >
                                                    <Pencil size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => deleteProduct(product.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Product Card (Button trigger for Modal) */}
                                <button
                                    onClick={openAddModal}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-neutral-800 hover:border-primary/50 hover:bg-primary/5 transition-all group h-full min-h-[160px]"
                                >
                                    <div className="h-10 w-10 rounded-full bg-neutral-800 group-hover:bg-primary text-neutral-500 group-hover:text-black flex items-center justify-center mb-2 transition-colors">
                                        <Plus size={24} />
                                    </div>
                                    <span className="font-bold text-neutral-500 group-hover:text-primary">Adicionar Produto</span>
                                </button>

                                <ProductFormDialog
                                    isOpen={isProductModalOpen}
                                    onOpenChange={setIsProductModalOpen}
                                    editingProduct={editingProduct}
                                    categories={categories}
                                    subcategories={subcategories}
                                    onSave={handleSaveProduct}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN SECTION: HOME CONFIG */}
                {mainSection === 'home-config' && (
                    <HomeConfigTab products={products} />
                )}

                {/* MAIN SECTION: COURIERS */}
                {
                    mainSection === 'couriers' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Truck className="w-6 h-6 text-primary" /> Motoboys Parceiros
                                    </h2>
                                    <Button size="sm" className="bg-primary text-black hover:bg-yellow-500 font-bold" onClick={() => alert("Funcionalidade de adicionar motoboy será implementada no backend")}>
                                        <Plus size={16} className="mr-2" /> Novo Motoboy
                                    </Button>
                                </div>

                                <div className="grid gap-4">
                                    {couriers.length === 0 ? (
                                        <div className="text-center py-12 bg-neutral-900 rounded-xl border border-dashed border-neutral-800">
                                            <Truck className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                                            <p className="text-neutral-500">Nenhum motoboy cadastrado ainda.</p>
                                            <p className="text-xs text-neutral-600 mt-1">Cadastre os parceiros para gerenciar as entregas.</p>
                                        </div>
                                    ) : (
                                        couriers.map(courier => (
                                            <div key={courier.id} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-bold text-lg">{courier.name}</h3>
                                                    <p className="text-sm text-neutral-500">{courier.phone} • {courier.vehicle_type}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${courier.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                                                        {courier.is_active ? "ATIVO" : "INATIVO"}
                                                    </span>
                                                    <Button variant="ghost" size="sm">Editar</Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* MAIN SECTION: ANALYTICS (Reports) */}
                {
                    mainSection === 'analytics' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">

                            {/* Stock Alert Widget */}
                            {products.some(p => (p.stock_quantity || 0) < 10) && (
                                <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl flex items-start gap-4">
                                    <div className="bg-red-900/50 p-2 rounded-full text-red-200 shrink-0">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-red-200">Alerta de Estoque Baixo</h3>
                                        <p className="text-sm text-red-300/70 mb-2">Os seguintes produtos estão acabando:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {products.filter(p => (p.stock_quantity || 0) < 10).map(p => (
                                                <span key={p.id} className="text-xs bg-red-950/50 text-red-200 px-2 py-1 rounded border border-red-900/50">
                                                    {p.name} ({p.stock_quantity})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Heatmap (Top Locations) */}
                                <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                        <MapPin className="w-5 h-5 text-primary" /> Top Bairros
                                    </h3>
                                    <div className="space-y-3">
                                        {/* Mock Analytics Logic - Group by Address content */}
                                        {Object.entries(
                                            orders.reduce((acc: any, order) => {
                                                // Simple clustering by taking first 15 chars of address or splitting by ','
                                                const district = order.address ? order.address.split(',')[1]?.trim() || "Centro" : "Retirada";
                                                acc[district] = (acc[district] || 0) + 1;
                                                return acc;
                                            }, {})
                                        )
                                            .sort(([, a], [, b]) => (b as number) - (a as number))
                                            .slice(0, 5)
                                            .map(([district, count], i) => (
                                                <div key={district} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-neutral-500 w-4 text-center">{i + 1}</span>
                                                        <span className="text-neutral-200">{district}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-neutral-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary"
                                                                style={{ width: `${((count as number) / totalOrdersCount) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-neutral-400 font-mono w-6 text-right">{count as number}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        {orders.length === 0 && <p className="text-neutral-500 text-sm">Sem dados suficientes.</p>}
                                    </div>
                                </div>

                                {/* Profit Estimator */}
                                <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                        <DollarSign className="w-5 h-5 text-green-500" /> Lucro Líquido Real (Entregues)
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="p-4 bg-neutral-900 rounded-lg">
                                            <span className="text-neutral-500 text-xs uppercase font-bold">Faturamento Bruto</span>
                                            <div className="text-2xl font-bold text-white">R$ {totalRevenue.toFixed(2).replace('.', ',')}</div>
                                        </div>
                                        <div className="p-4 bg-neutral-900 rounded-lg">
                                            <span className="text-neutral-500 text-xs uppercase font-bold">Custo Produtos (CMV)</span>
                                            <div className="text-2xl font-bold text-red-400">
                                                - R$ {totalCost.toFixed(2).replace('.', ',')}
                                                <span className="text-xs text-neutral-600 ml-2 font-normal">
                                                    ({totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(0) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-green-900/20 border border-green-900/50 rounded-lg">
                                            <span className="text-green-500 text-xs uppercase font-bold">Lucro Líquido</span>
                                            <div className="text-3xl font-black text-green-400">R$ {totalNetProfit.toFixed(2).replace('.', ',')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* MAIN SECTION: SETTINGS */}
                {
                    mainSection === 'settings' && (
                        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-neutral-800 p-8 rounded-xl border border-neutral-700">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-neutral-700 pb-4">
                                    <Settings className="w-6 h-6 text-primary" /> Configurações
                                </h2>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-lg font-semibold block text-neutral-200">Sons de Notificação</label>
                                            <p className="text-neutral-400">Reproduzir alerta sonoro quando novos pedidos chegarem.</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Label htmlFor="sound-mode" className="text-neutral-300 font-bold">
                                                {soundEnabled ? "ATIVADO" : "DESATIVADO"}
                                            </Label>
                                            <Switch
                                                id="sound-mode"
                                                checked={soundEnabled}
                                                onCheckedChange={setSoundEnabled}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-neutral-700 space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-neutral-200 flex items-center gap-2">
                                                <Truck className="w-5 h-5 text-blue-500" /> Entregas & Taxas
                                            </h3>
                                            <p className="text-neutral-400 text-sm mb-4">Gerencie o valor cobrado pela entrega e suas comissões.</p>

                                            <div className="flex flex-col gap-6">
                                                <div className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-neutral-300 font-bold mb-1 block">Taxa de Entrega do Motoboy</Label>
                                                        <p className="text-xs text-neutral-500">Valor fixo cobrado do cliente</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-neutral-500 font-bold">R$</span>
                                                        <input
                                                            type="number"
                                                            step="0.50"
                                                            className="bg-neutral-950 border border-neutral-700 text-white font-bold p-2 rounded w-24 text-right"
                                                            value={deliveryFee}
                                                            onChange={(e) => setDeliveryFee(e.target.value)}
                                                            onBlur={async () => {
                                                                if (!settingsId) return;
                                                                await supabase.from('settings').update({ delivery_fee: parseFloat(deliveryFee) }).eq('id', settingsId);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-neutral-300 font-bold mb-1 block">Minhas Comissões</Label>
                                                        <p className="text-xs text-neutral-500">Defina quanto você ganha por pedido (% ou Valor fixo)</p>
                                                    </div>
                                                    <Link href="/admin/financeiro">
                                                        <Button variant="outline" className="border-green-800 text-green-400 hover:bg-green-900/20">
                                                            <DollarSign className="w-4 h-4 mr-2" />
                                                            Configurar Comissões
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
                                        <div>
                                            <label className="text-lg font-semibold block text-neutral-200">Pagamentos Online (Stripe)</label>


                                            <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                                <h3 className="font-bold text-neutral-300 mb-2">Sobre o Sistema</h3>
                                                <p className="text-sm text-neutral-500">Versão: 1.0.0 (Admin 4.0)</p>
                                                <p className="text-sm text-neutral-500">Ambiente: {process.env.NODE_ENV}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
