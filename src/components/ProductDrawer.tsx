"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ProductDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onAddToCart: (quantity: number) => void;
}

export function ProductDrawer({ isOpen, onClose, product, onAddToCart }: ProductDrawerProps) {
    const [quantity, setQuantity] = useState(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset quantity when product changes or drawer opens
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
        }
    }, [isOpen, product]);

    if (!mounted) return null;
    if (!product) return null;

    const handleIncrement = () => setQuantity(prev => prev + 1);
    const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    const handleAddPack = (amount: number) => setQuantity(prev => prev + amount);

    const totalPrice = product.price * quantity;

    const content = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[9999] bg-neutral-900 border-t border-neutral-800 rounded-t-[2.5rem] p-6 pb-8 md:max-w-xl md:mx-auto md:rounded-[2.5rem] md:bottom-4 md:border shadow-2xl"
                    >
                        {/* Drag Handle (Visual only for now) */}
                        <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto mb-6" />

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col gap-6">
                            {/* Header: Image & Info */}
                            <div className="flex items-center gap-5">
                                <div className="relative w-24 h-24 bg-white rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                                    {product.image_url ? (
                                        <Image
                                            src={product.image_url}
                                            alt={product.name}
                                            fill
                                            className="object-contain p-1"
                                        />
                                    ) : (
                                        <div className="text-neutral-400">
                                            <ShoppingBag size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-white leading-tight mb-1 line-clamp-2">
                                        {product.name}
                                    </h2>
                                    <p className="text-neutral-400 text-sm line-clamp-2">
                                        {product.description}
                                    </p>
                                    <p className="text-primary font-black text-xl mt-2">
                                        R$ {product.price.toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-neutral-800 w-full" />

                            {/* Quantity Controls */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-300 font-medium">Quantidade</span>
                                    <div className="flex items-center gap-4 bg-neutral-800 p-1.5 rounded-full border border-neutral-700">
                                        <button
                                            onClick={handleDecrement}
                                            className="w-10 h-10 flex items-center justify-center bg-neutral-700/50 hover:bg-neutral-700 rounded-full text-white transition-colors disabled:opacity-50"
                                            disabled={quantity <= 1}
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="text-xl font-bold text-white min-w-[2ch] text-center w-8">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={handleIncrement}
                                            className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 rounded-full text-black transition-colors"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Pack Buttons (All Products) */}
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-2">
                                    {[6, 12, 15].map((pack) => (
                                        <button
                                            key={pack}
                                            onClick={() => handleAddPack(pack)}
                                            className="flex-1 whitespace-nowrap px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-primary/50 text-neutral-300 text-sm font-semibold transition-all active:scale-95"
                                        >
                                            +{pack} Unidades
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Add Button */}
                            <Button
                                onClick={() => {
                                    onAddToCart(quantity);
                                    onClose();
                                }}
                                className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 mt-2"
                            >
                                <div className="flex items-center justify-between w-full px-2">
                                    <span>Adicionar ao Carrinho</span>
                                    <span className="bg-black/20 px-3 py-1 rounded-lg text-base">
                                        R$ {totalPrice.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}
