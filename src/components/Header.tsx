"use client";

import Link from "next/link";
import { ShoppingCart, Beer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useState } from "react";

export function Header() {
    const { cartCount, cartTotal } = useCart();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <header className="sticky top-0 z-40 w-full bg-primary shadow-sm border-b border-yellow-500">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">

                {/* Logo Area */}
                <Link href="/" className="flex items-center gap-2 shrink-0 group">
                    <div className="bg-black p-2 rounded-full transition-transform group-hover:scale-105">
                        <Beer className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-black hidden sm:block">
                        DISTRIBUIDORA<span className="font-light">ADY</span>
                    </span>
                </Link>

                {/* Search Bar (Visual Only) */}
                <div className="hidden md:flex flex-1 max-w-md mx-auto">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Busque por cerveja, água, refrigerante..."
                            className="w-full h-10 px-4 pl-10 rounded-full text-sm outline-none text-black placeholder:text-gray-500 shadow-inner bg-white/90 focus:bg-white transition-colors"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                    </div>
                </div>

                {/* Cart Area */}
                <div className="flex items-center gap-3">
                    {mounted && cartTotal > 0 && (
                        <div className="hidden sm:flex flex-col items-end leading-tight text-black">
                            <span className="text-[10px] font-bold uppercase opacity-70">Total</span>
                            <span className="font-black text-sm">
                                R$ {cartTotal.toFixed(2).replace(".", ",")}
                            </span>
                        </div>
                    )}

                    <Link href="/checkout">
                        <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full hover:bg-black/10 transition-colors">
                            <ShoppingCart className="h-6 w-6 text-black" />
                            {mounted && cartCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-in zoom-in border-2 border-primary">
                                    {cartCount}
                                </span>
                            )}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Mobile Search Bar (Below Header) */}
            <div className="md:hidden px-4 pb-3">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="O que você vai beber hoje?"
                        className="w-full h-10 px-4 pl-10 rounded-full text-sm outline-none text-black placeholder:text-gray-500 shadow-sm bg-white"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                </div>
            </div>
        </header>
    );
}


