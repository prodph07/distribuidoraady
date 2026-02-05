"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, AlertTriangle, CheckCircle2, Bike, CreditCard, Banknote, MapPin, User, Phone, ShoppingBag, ArrowLeft, Plus, DoorClosed } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PixPaymentModal } from "@/components/PixPaymentModal";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useStoreSettings } from "@/hooks/useStoreSettings";

export default function CheckoutPage() {
    const { items, removeFromCart, cartTotal, clearCart, addToCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { trackEvent } = useAnalytics();
    const { isOpen, loading: storeStatusLoading } = useStoreSettings();

    useEffect(() => {
        if (items.length > 0) {
            trackEvent('checkout_start', {
                cart_value: cartTotal,
                item_count: items.length
            });
        }
    }, []); // Run once on mount

    // Single Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        cep: "",
        address: "",
        number: "",
        complement: "",
    });
    const [paymentMethod, setPaymentMethod] = useState("online"); // Default to online (Pix)
    const [changeNeeded, setChangeNeeded] = useState(""); // Input for change
    const [commitment, setCommitment] = useState(false);

    // Fee State
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [minOrderValue, setMinOrderValue] = useState(0);
    const [serviceFee, setServiceFee] = useState(0);
    const [servicePercent, setServicePercent] = useState(0); // Only for display if tiers

    // Config State
    const [tiers, setTiers] = useState<any[]>([]);
    const [commissionType, setCommissionType] = useState<"tiers" | "fixed">("tiers");
    const [fixedCommission, setFixedCommission] = useState(0);

    // Pix Simulator State
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<any>(null);

    const hasExchangeItems = items.some((i) => i.is_returnable && i.has_exchange);

    // Load saved data from localStorage on mount
    // Load saved data from localStorage on mount
    useEffect(() => {
        // Load settings for fees
        const fetchSettings = async () => {
            const { data } = await supabase.from('settings').select('*').single();
            if (data) {
                setDeliveryFee(Number(data.delivery_fee));
                setTiers(data.commission_tiers || []);
                setCommissionType(data.commission_type || "tiers");
                setFixedCommission(Number(data.commission_fixed_value || 0));
                setMinOrderValue(Number(data.min_order_value || 0));
            }
        };
        fetchSettings();

        // Load saved user data
        const savedData = localStorage.getItem("customer_data");
        if (savedData) {
            try {
                setFormData(JSON.parse(savedData));
            } catch (e) {
                console.error("Error loading saved data", e);
            }
        }
    }, []);

    // Calculate Dynamic Service Fee
    useEffect(() => {
        if (commissionType === 'fixed') {
            setServiceFee(fixedCommission);
            setServicePercent(0); // Not applicable
            return;
        }

        if (!tiers.length) return;

        let percent = 5; // fallback
        // Tiers ex: [{max: 50, percent: 10}, {max: 150, percent: 7}]
        // We look for the first tier where cartTotal <= max
        const foundTier = tiers.find(t => cartTotal <= t.max);
        if (foundTier) {
            percent = foundTier.percent;
        } else {
            // If greater than all tiers
            percent = tiers[tiers.length - 1]?.percent || 5;
        }

        setServicePercent(percent);
        setServiceFee(cartTotal * (percent / 100));

    }, [cartTotal, tiers, commissionType, fixedCommission]);

    const finalTotal = cartTotal + deliveryFee + serviceFee;

    const handleRemove = (id: number, hasExchange: boolean) => {
        removeFromCart(id, hasExchange);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    status: 'pending_payment',
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    address: `${formData.address}, ${formData.number} ${formData.complement ? '- ' + formData.complement : ''}`,
                    total_amount: finalTotal,
                    delivery_fee: deliveryFee,
                    service_fee: serviceFee,
                    payment_id: paymentMethod === 'online' ? 'offline' : 'pay_on_delivery', // Legacy field, keeping 'offline' for logic compatibility or changing to new status
                    payment_method: paymentMethod,
                    change_needed: paymentMethod === 'money' && changeNeeded ? parseFloat(changeNeeded.replace(',', '.')) : 0,
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                is_exchange: item.has_exchange,
                price_snapshot: item.is_returnable && !item.has_exchange ? item.price + item.deposit_price : item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Save for "Magic Link" experience
            localStorage.setItem("last_order_id", order.id);
            localStorage.setItem("customer_data", JSON.stringify(formData)); // Remember user for next time

            // 4. Handle Payment Flow
            trackEvent('order_complete', {
                order_id: order.id,
                total_amount: finalTotal,
                payment_method: paymentMethod
            });

            if (paymentMethod === 'online') {
                // Open Pix Mock Modal
                setCreatedOrder(order);
                setIsPixModalOpen(true);
                // clearCart(); // FIX: Don't clear cart yet, otherwise we hit 'Empty Cart' state and Modal acts weird
                // We DO NOT redirect yet. We wait for the modal to detect payment.
            } else {
                // Offline Payment (Money/Machine)
                clearCart();
                router.push(`/status/${order.id}`);
            }

        } catch (error: any) {
            console.error("Error creating order (FULL DETAILS):", JSON.stringify(error, null, 2));
            alert(`Erro ao criar pedido: ${error.message || "Verifique o console"}`);
        } finally {
            setLoading(false);
        }
    };

    const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            // Simple logic: just get 4 random-ish products (or first 4)
            const { data } = await supabase.from('products').select('*').limit(4);
            if (data) setRecommendedProducts(data);
        };
        fetchRecommendations();
    }, []);

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl">

                    <div className="flex flex-col items-center justify-center text-center mb-12 animate-in fade-in zoom-in duration-500">
                        <div className="bg-neutral-900 p-6 rounded-full mb-6 border border-neutral-800 relative group">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
                            <div className="w-16 h-16 text-neutral-600 flex items-center justify-center relative z-10">
                                <ShoppingBag className="w-12 h-12" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-white">Sua sacola está vazia</h2>
                        <p className="text-neutral-400 mb-8 max-w-md mx-auto">Que tal aproveitar e pedir aquela cerveja gelada ou um petisco para acompanhar?</p>
                        <Link href="/">
                            <Button className="h-12 px-8 rounded-full font-bold text-base shadow-lg hover:shadow-primary/20 transition-all hover:scale-105 bg-primary text-black hover:bg-yellow-400">
                                VER CARDÁPIO COMPLETO
                            </Button>
                        </Link>
                    </div>

                    {/* Recommendations for Empty State */}
                    {recommendedProducts.length > 0 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-150">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="bg-primary w-2 h-6 rounded-full inline-block" />
                                Sugestões para você
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {recommendedProducts.map(product => (
                                    <div key={product.id} className="transform hover:-translate-y-1 transition-transform duration-300">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col font-sans pb-24 text-neutral-200">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-6 max-w-lg">
                <div className="flex items-center gap-2 mb-6">
                    <Link href="/" className="bg-neutral-800 p-2 rounded-full shadow-sm hover:bg-neutral-700 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className="text-2xl font-black text-white tracking-tight">Finalizar Pedido</h1>
                </div>

                {!isOpen && !storeStatusLoading && (
                    <div className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-5 mb-6 flex items-start gap-4 animate-in slide-in-from-top-4">
                        <div className="bg-red-900/40 p-2 rounded-full shrink-0">
                            <DoorClosed className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-black text-red-500 text-lg">Loja Fechada</h3>
                            <p className="text-sm text-red-200/80 font-medium leading-relaxed">
                                Nosso horário de atendimento é das 09h às 21h. <br />
                                Você pode montar seu carrinho, mas <strong>só aceitamos pedidos durante o horário de funcionamento.</strong>
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SECTION 0: REVIEW CART */}
                    <section className="bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-800">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                            <ShoppingBag className="w-5 h-5 text-primary" /> Revisar Pedido
                        </h2>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={`${item.id}-${item.has_exchange}`} className="flex gap-4 items-center bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/50">
                                    <div className="relative w-16 h-16 bg-white rounded-lg p-1 shrink-0">
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                                        {item.is_returnable && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-red-500 text-[8px] text-white font-bold" title="Retornável">R</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-neutral-200 text-sm leading-tight line-clamp-2">{item.name}</h3>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {item.is_returnable ? (
                                                item.has_exchange ? (
                                                    <span className="text-yellow-500 flex items-center gap-1"><AlertTriangle size={10} /> Com troca</span>
                                                ) : (
                                                    <span className="text-green-500">Comprando casco</span>
                                                )
                                            ) : (
                                                <span>Unidade</span>
                                            )}
                                        </p>
                                        <div className="font-bold text-primary mt-1">
                                            R$ {(item.has_exchange || !item.is_returnable ? item.price : item.price + item.deposit_price).toFixed(2).replace('.', ',')}
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (item.quantity > 1) {
                                                        addToCart(item, -1, item.has_exchange);
                                                    } else {
                                                        handleRemove(item.id, item.has_exchange);
                                                    }
                                                }}
                                                className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item, 1, item.has_exchange)}
                                                className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(item.id, item.has_exchange)}
                                            className="text-xs text-red-500/70 hover:text-red-500 underline decoration-red-500/30 underline-offset-2 transition-colors"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SECTION 1: WHO ARE YOU? */}
                    <section className="bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-800">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                            <User className="w-5 h-5 text-primary" /> Seus Dados
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="phone" className="font-bold pl-1 text-xs uppercase text-neutral-500">Celular (WhatsApp)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-neutral-500" />
                                    <Input
                                        id="phone"
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="(11) 99999-9999"
                                        className="pl-10 rounded-xl h-12 bg-neutral-800 border-neutral-700 focus:ring-primary focus:border-primary font-bold text-lg text-white placeholder:text-neutral-600"
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-500 mt-1 pl-1">Usaremos seu número para acompanhar o pedido.</p>
                            </div>
                            <div>
                                <Label htmlFor="name" className="font-bold pl-1 text-xs uppercase text-neutral-500">Nome Completo</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: João da Silva"
                                    className="rounded-xl h-12 bg-neutral-800 border-neutral-700 focus:ring-primary focus:border-primary text-white placeholder:text-neutral-600"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: WHERE? */}
                    <section className="bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-800">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                            <MapPin className="w-5 h-5 text-primary" /> Entrega
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-3">
                                    <Label htmlFor="address" className="font-bold pl-1 text-xs uppercase text-neutral-500">Endereço</Label>
                                    <Input
                                        id="address"
                                        required
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Rua, Avenida..."
                                        className="rounded-xl h-12 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label htmlFor="number" className="font-bold pl-1 text-xs uppercase text-neutral-500">Nº</Label>
                                    <Input
                                        id="number"
                                        required
                                        value={formData.number}
                                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                                        placeholder="123"
                                        className="rounded-xl h-12 bg-neutral-800 border-neutral-700 text-center font-bold text-white placeholder:text-neutral-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="complement" className="font-bold pl-1 text-xs uppercase text-neutral-500">Complemento (Opcional)</Label>
                                <Input
                                    id="complement"
                                    value={formData.complement}
                                    onChange={e => setFormData({ ...formData, complement: e.target.value })}
                                    placeholder="Apto, Bloco, Ponto de ref..."
                                    className="rounded-xl h-12 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: RULES & SUMMARY */}
                    <section className="space-y-4">
                        {/* Exchange Alert */}
                        {hasExchangeItems && (
                            <div className="bg-yellow-900/20 border-2 border-yellow-700/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-600 rounded-full opacity-10" />
                                <div className="flex items-start gap-4">
                                    <div className="bg-yellow-900/40 p-2 rounded-full shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-yellow-500 text-lg">Troca de Cascos</h3>
                                        <p className="text-sm text-yellow-200/80 font-medium leading-relaxed">
                                            Você tem garrafas vazias para entregar?
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 pt-2 bg-black/20 p-3 rounded-xl border border-yellow-900/30">
                                    <input
                                        id="commitment"
                                        type="checkbox"
                                        required
                                        checked={commitment}
                                        onChange={e => setCommitment(e.target.checked)}
                                        className="h-5 w-5 rounded-md border-yellow-600 bg-neutral-900 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                                    />
                                    <label htmlFor="commitment" className="text-sm font-bold text-yellow-500 cursor-pointer">
                                        Sim, tenho os cascos para troca!
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Payment & Total */}
                        <div className="bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-800">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                <Banknote className="w-5 h-5 text-primary" /> Pagamento
                            </h2>

                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">

                                {/* OPTION 1: PIX */}
                                <Label
                                    htmlFor="online"
                                    className={cn(
                                        "flex flex-col items-center justify-center space-y-2 border-2 p-3 rounded-2xl cursor-pointer transition-all h-28 text-center hover:border-neutral-700 relative",
                                        paymentMethod === 'online'
                                            ? "border-primary bg-primary/10 text-white"
                                            : "border-neutral-800 bg-neutral-800 text-neutral-400"
                                    )}
                                >
                                    <RadioGroupItem value="online" id="online" className="sr-only" />
                                    {paymentMethod === 'online' && <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full" />}
                                    <div className="bg-[#32BCAD] p-2 rounded-full text-white mb-1">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm">Pix Online</span>
                                    <span className="text-[10px] text-neutral-500 font-medium">Aprovação imediata</span>
                                </Label>

                                {/* OPTION 2: CARD MACHINE */}
                                <Label
                                    htmlFor="card_machine"
                                    className={cn(
                                        "flex flex-col items-center justify-center space-y-2 border-2 p-3 rounded-2xl cursor-pointer transition-all h-28 text-center hover:border-neutral-700 relative",
                                        paymentMethod === 'card_machine'
                                            ? "border-primary bg-primary/10 text-white"
                                            : "border-neutral-800 bg-neutral-800 text-neutral-400"
                                    )}
                                >
                                    <RadioGroupItem value="card_machine" id="card_machine" className="sr-only" />
                                    {paymentMethod === 'card_machine' && <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full" />}
                                    <div className="bg-neutral-700 p-2 rounded-full text-white mb-1">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm">Maquininha</span>
                                    <span className="text-[10px] text-neutral-500 font-medium">Crédito/Débito na entrega</span>
                                </Label>

                                {/* OPTION 3: CASH */}
                                <Label
                                    htmlFor="money"
                                    className={cn(
                                        "flex flex-col items-center justify-center space-y-2 border-2 p-3 rounded-2xl cursor-pointer transition-all h-28 text-center hover:border-neutral-700 relative",
                                        paymentMethod === 'money'
                                            ? "border-primary bg-primary/10 text-white"
                                            : "border-neutral-800 bg-neutral-800 text-neutral-400"
                                    )}
                                >
                                    <RadioGroupItem value="money" id="money" className="sr-only" />
                                    {paymentMethod === 'money' && <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full" />}
                                    <div className="bg-green-700 p-2 rounded-full text-white mb-1">
                                        <Banknote className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm">Dinheiro</span>
                                    <span className="text-[10px] text-neutral-500 font-medium">Pagamento na entrega</span>
                                </Label>
                            </RadioGroup>

                            {/* CHANGE INPUT FOR CASH */}
                            {paymentMethod === 'money' && (
                                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-6 animate-in slide-in-from-top-2">
                                    <Label htmlFor="change" className="font-bold text-sm text-neutral-400 mb-2 block">
                                        Precisa de troco para quanto?
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-neutral-500 font-bold">R$</span>
                                        <Input
                                            id="change"
                                            type="number"
                                            placeholder="Ex: 50,00"
                                            value={changeNeeded}
                                            onChange={(e) => setChangeNeeded(e.target.value)}
                                            className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 font-bold text-lg"
                                        />
                                    </div>
                                    <p className="text-[11px] text-neutral-500 mt-2">
                                        Deixe em branco se não precisar de troco.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-800">
                                <div className="flex justify-between items-center text-sm text-neutral-500">
                                    <span>Subtotal</span>
                                    <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-neutral-500">
                                    <span>Taxa de Entrega</span>
                                    <span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-neutral-500">
                                    <span>Taxa de Serviço {commissionType === 'tiers' ? `(${servicePercent}%)` : '(Fixo)'}</span>
                                    <span>R$ {serviceFee.toFixed(2).replace(".", ",")}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl pt-2 border-t border-neutral-800/50">
                                    <span className="text-white font-bold">Total a pagar</span>
                                    <span className="text-2xl font-black text-primary">R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
                                </div>

                                {/* Minimum Order Warning */}
                                {cartTotal < minOrderValue && (
                                    <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-500 text-sm font-bold flex items-center gap-2 animate-pulse">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span>
                                            Pedido mínimo é R$ {minOrderValue.toFixed(2).replace('.', ',')}.
                                            <br />
                                            Faltam R$ {(minOrderValue - cartTotal).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2.5: RELATED PRODUCTS (UPSELL) */}
                    {recommendedProducts.filter(p => !items.some(i => i.id === p.id)).length > 0 && (
                        <section className="space-y-4 pt-4 mb-24 md:mb-6">
                            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider pl-2">Aproveite também</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {recommendedProducts.filter(p => !items.some(i => i.id === p.id)).slice(0, 2).map(product => (
                                    <div key={product.id} className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
                                        <div className="relative aspect-square w-full bg-white rounded-lg p-2 flex items-center justify-center">
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm line-clamp-1">{product.name}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-primary font-bold text-sm">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-7 w-7 rounded-full p-0 bg-neutral-800 hover:bg-primary hover:text-black border border-neutral-700"
                                                    onClick={() => addToCart(product, 1, false)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* BIG BUTTON */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900 border-t border-neutral-800 shadow-[0_-4px_10px_rgba(0,0,0,0.2)] z-10 md:relative md:bg-transparent md:border-t-0 md:shadow-none md:p-0">
                        <Button
                            type="submit"
                            disabled={(hasExchangeItems && !commitment) || loading || cartTotal < minOrderValue || (!isOpen && !storeStatusLoading)}
                            className="w-full h-16 rounded-2xl font-black text-xl bg-primary text-black hover:bg-yellow-400 shadow-xl shadow-yellow-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                "ENVIANDO..."
                            ) : (
                                paymentMethod === 'online' ? (
                                    <>
                                        <span>PAGAR COM PIX</span>
                                        <div className="w-5 h-5 bg-[#32BCAD] rounded-full flex items-center justify-center text-white text-[10px] font-black">P</div>
                                    </>
                                ) : (
                                    <>
                                        <span>FAZER PEDIDO</span>
                                    </>
                                )
                            )}
                        </Button>
                    </div>
                    {/* Spacer for fixed bottom button on mobile */}
                    <div className="h-20 md:hidden" />
                </form>
            </main>

            {createdOrder && (
                <PixPaymentModal
                    isOpen={isPixModalOpen}
                    onClose={() => setIsPixModalOpen(false)} // If they close manually, they stay on checkout?? Or maybe redirect to status?
                    orderId={createdOrder.id}
                    totalAmount={createdOrder.total_amount} // This is now Final Total
                    onSuccess={() => {
                        clearCart(); // Clear cart only when payment is "confirmed" (simulated)
                        setIsPixModalOpen(false);
                        router.push(`/status/${createdOrder.id}`);
                    }}
                />
            )}
        </div>
    );
}
