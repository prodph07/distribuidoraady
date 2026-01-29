"use client";

import { useEffect, useState, useRef } from "react";
import { AdminOrderCard } from "@/components/AdminOrderCard";
import { Switch } from "@/components/ui/switch";
import { Product, Order, Category, Subcategory } from "@/types";
import { supabase } from "@/lib/supabase";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Database, TrendingUp, ShoppingBag, DollarSign, Bell, BellOff, AlignJustify, Grid, Settings, Plus, Trash2, Minus, Pencil } from "lucide-react";
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
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isReturnable, setIsReturnable] = useState(false);

    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [realtimeStatus, setRealtimeStatus] = useState<string>("Conectando...");
    const [audioLocked, setAudioLocked] = useState(true); // Default to true to force initial interaction
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [mainSection, setMainSection] = useState<'orders' | 'stock' | 'settings'>('orders');

    // KPIs
    const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
        // Fetch orders with items
        const { data: ordersData } = await supabase
            .from('orders')
            .select(`
            *,
            order_items (
                quantity,
                is_exchange,
                products ( name )
            )
        `)
            .order('created_at', { ascending: false });

        if (ordersData) {
            setOrders(ordersData as any);
        }
    };

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
            </header>

            {/* Audio Unlock Overlay */}
            {audioLocked && (
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
            )}

            <main className="container mx-auto p-6 space-y-8">

                {/* KPIs */}
                <section className="grid sm:grid-cols-3 gap-4">
                    <Card className="bg-neutral-800 border-neutral-700">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-400">Faturamento Hoje</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2).replace('.', ',')}</div>
                            <p className="text-xs text-neutral-500">+20.1% em relação a ontem (mock)</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-neutral-800 border-neutral-700">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-400">Total Pedidos</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalOrders}</div>
                            <p className="text-xs text-neutral-500">4 pd pendentes agora</p>
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
                        {/* View Control Bar */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="bg-neutral-800 p-1 rounded-lg border border-neutral-700 inline-flex">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    <AlignJustify size={18} />
                                    <span className="text-sm font-medium">Lista</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    <Grid size={18} />
                                    <span className="text-sm font-medium">Kanban</span>
                                </button>
                            </div>
                        </div>

                        {viewMode === 'kanban' ? (
                            <KanbanBoard orders={orders} onUpdateStatus={updateOrderStatus} />
                        ) : (
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="bg-neutral-800 border border-neutral-700 mb-6">
                                    <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
                                    <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
                                        Pendentes ({pendingOrders.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="preparing" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                                        Preparando ({orders.filter(o => o.status === 'preparing').length})
                                    </TabsTrigger>
                                    <TabsTrigger value="delivery" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                                        Entrega ({deliveryOrders.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="completed" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                                        Histórico
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="all" className="space-y-4">
                                    {orders.length === 0 ? <p className="text-neutral-500">Sem pedidos.</p> : orders.map(order => <AdminOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />)}
                                </TabsContent>
                                <TabsContent value="pending" className="space-y-4">
                                    {pendingOrders.length === 0 ? <p className="text-neutral-500">Nenhum pedido pendente.</p> : pendingOrders.map(order => <AdminOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />)}
                                </TabsContent>
                                <TabsContent value="preparing" className="space-y-4">
                                    {orders.filter(o => o.status === 'preparing').map(order => <AdminOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />)}
                                    {orders.filter(o => o.status === 'preparing').length === 0 && <p className="text-neutral-500">Nenhum pedido em preparo.</p>}
                                </TabsContent>
                                <TabsContent value="delivery" className="space-y-4">
                                    {deliveryOrders.length === 0 ? <p className="text-neutral-500">Nada em entrega.</p> : deliveryOrders.map(order => <AdminOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />)}
                                </TabsContent>
                                <TabsContent value="completed" className="space-y-4">
                                    {completedOrders.length === 0 ? <p className="text-neutral-500">Histórico vazio.</p> : completedOrders.map(order => <AdminOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />)}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                )}

                {/* MAIN SECTION: STOCK */}
                {mainSection === 'stock' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Database className="w-6 h-6 text-primary" /> Gerenciamento de Estoque
                                </h2>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide max-w-full">
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
                                    <Button variant="ghost" size="sm" onClick={fetchProducts} className="text-neutral-400 hover:text-white ml-2">
                                        ↻
                                    </Button>

                                    {/* Manage Categories Modal */}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="ml-2 border-neutral-700 hover:bg-neutral-800">
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
                                                            const parent = categories.find(c => c.id === sc.category_id);
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
                            </div>

                            {/* Subfilters */}
                            {selectedCategory !== 'Todas' && (
                                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
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
                                <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                                    <DialogTrigger asChild>
                                        <button
                                            onClick={openAddModal}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-neutral-800 hover:border-primary/50 hover:bg-primary/5 transition-all group h-full min-h-[160px]"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-neutral-800 group-hover:bg-primary text-neutral-500 group-hover:text-black flex items-center justify-center mb-2 transition-colors">
                                                <Plus size={24} />
                                            </div>
                                            <span className="font-bold text-neutral-500 group-hover:text-primary">Adicionar Produto</span>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                                        <DialogHeader>
                                            <DialogTitle>{editingProduct ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
                                            <DialogDescription className="text-neutral-400">
                                                {editingProduct ? "Atualize os dados do produto." : "Preencha os dados da cerveja para adicionar ao catálogo."}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Nome do Produto</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    defaultValue={editingProduct?.name}
                                                    placeholder="Ex: Skol 300ml"
                                                    className="bg-neutral-800 border-neutral-700 text-white"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="category">Categoria</Label>
                                                    <select
                                                        id="category"
                                                        name="category"
                                                        defaultValue={editingProduct?.category || ""}
                                                        className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {categories.map(c => (
                                                            <option key={c.id} value={c.name}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="subcategory">Subcategoria</Label>
                                                    <select
                                                        id="subcategory"
                                                        name="subcategory"
                                                        defaultValue={editingProduct?.subcategory || ""}
                                                        className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {subcategories.map(sc => (
                                                            <option key={sc.id} value={sc.name}>{sc.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-4 bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                                                <input type="hidden" name="is_returnable" value={isReturnable ? "on" : "off"} />
                                                <Switch
                                                    checked={isReturnable}
                                                    onCheckedChange={setIsReturnable}
                                                    id="is_returnable"
                                                />
                                                <Label htmlFor="is_returnable" className="cursor-pointer">
                                                    Porduto Retornável? (Cobrar Casco)
                                                </Label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Liquid / Base Inputs */}
                                                <div className="grid gap-2">
                                                    <Label htmlFor="price">{isReturnable ? "Venda (Líquido/Refil)" : "Preço Venda (R$)"}</Label>
                                                    <Input
                                                        id="price"
                                                        name="price"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={editingProduct?.price}
                                                        placeholder="0.00"
                                                        className="bg-neutral-800 border-neutral-700 text-white"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="cost_price">{isReturnable ? "Custo (Líquido)" : "Preço Custo (R$)"}</Label>
                                                    <Input
                                                        id="cost_price"
                                                        name="cost_price"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={editingProduct?.cost_price || ""}
                                                        placeholder="0.00"
                                                        className="bg-neutral-800 border-neutral-700 text-white"
                                                    />
                                                </div>

                                                {/* Returnable Extra Inputs */}
                                                {isReturnable && (
                                                    <>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="deposit_price" className="text-yellow-400">Venda do Casco (Depósito)</Label>
                                                            <Input
                                                                id="deposit_price"
                                                                name="deposit_price"
                                                                type="number"
                                                                step="0.01"
                                                                defaultValue={editingProduct?.deposit_price || ""}
                                                                placeholder="Ex: 5.00"
                                                                className="bg-neutral-800 border-yellow-500/30 text-white"
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="bottle_cost" className="text-yellow-400">Custo do Casco</Label>
                                                            <Input
                                                                id="bottle_cost"
                                                                name="bottle_cost"
                                                                type="number"
                                                                step="0.01"
                                                                defaultValue={editingProduct?.bottle_cost || ""}
                                                                placeholder="Ex: 2.50"
                                                                className="bg-neutral-800 border-yellow-500/30 text-white"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                <div className="grid gap-2">
                                                    <Label htmlFor="stock_quantity">Qtd Inicial</Label>
                                                    <Input
                                                        id="stock_quantity"
                                                        name="stock_quantity"
                                                        type="number"
                                                        defaultValue={editingProduct?.stock_quantity || 0}
                                                        placeholder="0"
                                                        className="bg-neutral-800 border-neutral-700 text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="image_url">URL da Imagem</Label>
                                                <Input
                                                    id="image_url"
                                                    name="image_url"
                                                    defaultValue={editingProduct?.image_url}
                                                    placeholder="https://..."
                                                    className="bg-neutral-800 border-neutral-700 text-white"
                                                />
                                            </div>

                                            <Button type="submit" className="w-full bg-primary text-black hover:bg-yellow-400 font-bold">
                                                {editingProduct ? "Atualizar Produto" : "Salvar Produto"}
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN SECTION: SETTINGS */}
                {mainSection === 'settings' && (
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

                                <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                    <h3 className="font-bold text-neutral-300 mb-2">Sobre o Sistema</h3>
                                    <p className="text-sm text-neutral-500">Versão: 1.0.0 (Admin 4.0)</p>
                                    <p className="text-sm text-neutral-500">Ambiente: {process.env.NODE_ENV}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
