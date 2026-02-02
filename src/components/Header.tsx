"use client";

import Link from "next/link";
import { ShoppingCart, Beer, Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import Image from "next/image";
import { ProductDrawer } from "./ProductDrawer";
import { PostAddCartDialog } from "./PostAddCartDialog";
import { ProductExchangeDialog } from "./ProductExchangeDialog";

export function Header() {
    const { cartCount, cartTotal, addToCart } = useCart();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const desktopWrapperRef = useRef<HTMLDivElement>(null);
    const mobileWrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Drawer & Dialog States
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isExchangeDialogOpen, setIsExchangeDialogOpen] = useState(false);
    const [isPostAddDialogOpen, setIsPostAddDialogOpen] = useState(false);
    const [pendingQuantity, setPendingQuantity] = useState(1);

    useEffect(() => setMounted(true), []);

    // Click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const isOutsideDesktop = desktopWrapperRef.current && !desktopWrapperRef.current.contains(target);
            const isOutsideMobile = mobileWrapperRef.current && !mobileWrapperRef.current.contains(target);

            if (isOutsideDesktop && isOutsideMobile) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsLoading(true);
        setShowResults(true);

        searchTimeoutRef.current = setTimeout(async () => {
            const { data } = await supabase
                .from("products")
                .select("*, calculated_stock")
                .eq("in_stock", true)
                .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
                .order("name")
                .limit(5);

            setSearchResults((data as Product[]) || []);
            setIsLoading(false);
        }, 300); // 300ms debounce
    };

    const goToSearchPage = () => {
        setShowResults(false);
        if (searchQuery.trim()) {
            router.push(`/busca?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            goToSearchPage();
        }
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDrawerOpen(true);
        setShowResults(false);
    };

    // Drawer Logic (Copied from ProductCard)
    const handleDrawerAddToCart = (quantity: number) => {
        if (!selectedProduct) return;
        setPendingQuantity(quantity);
        setIsDrawerOpen(false);

        if (selectedProduct.is_returnable) {
            setTimeout(() => setIsExchangeDialogOpen(true), 300);
        } else {
            addToCart(selectedProduct, quantity, false);
            setTimeout(() => setIsPostAddDialogOpen(true), 300);
        }
    };

    const confirmExchange = (exchangeOption: "exchange" | "buy") => {
        if (!selectedProduct) return;
        addToCart(selectedProduct, pendingQuantity, exchangeOption === "exchange");
        setIsPostAddDialogOpen(true);
    };

    return (
        <>
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

                    {/* Search Bar (Desktop) */}
                    <div className="hidden md:flex flex-1 max-w-md mx-auto relative" ref={desktopWrapperRef}>
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Busque por cerveja, água, refrigerante..."
                                className="w-full h-10 px-4 pl-10 rounded-full text-sm outline-none text-black placeholder:text-gray-500 shadow-inner bg-white/90 focus:bg-white transition-colors"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                            />
                            <button
                                onClick={goToSearchPage}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                            >
                                <Search size={16} />
                            </button>
                            {isLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                </div>
                            )}
                        </div>

                        {/* Dropdown Results */}
                        {showResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                {searchResults.length > 0 ? (
                                    <>
                                        <ul>
                                            {searchResults.map((product) => (
                                                <li key={product.id}>
                                                    <button
                                                        onClick={() => handleProductClick(product)}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        <div className="relative w-10 h-10 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                                            {product.image_url ? (
                                                                <Image
                                                                    src={product.image_url}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-contain p-1"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center w-full h-full text-gray-300">
                                                                    <Beer size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={goToSearchPage}
                                            className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-primary-dark transition-colors text-center block border-t border-gray-100"
                                        >
                                            Ver todos os resultados
                                        </button>
                                    </>
                                ) : (
                                    !isLoading && (
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            Nenhum produto encontrado.
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/pedidos">
                            <Button
                                variant="ghost"
                                className="rounded-full hover:bg-black/10 text-black border-2 border-transparent hover:border-black/5 font-bold flex items-center gap-2 px-3"
                                title="Meus Pedidos"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6" /><path d="M9 16h6" /><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                                <span>Pedidos</span>
                            </Button>
                        </Link>

                        <Link href="/checkout">
                            <Button
                                variant="default"
                                size="lg"
                                className={`relative rounded-full transition-all border-2 border-transparent hover:border-black shadow-md ${mounted && cartCount > 0 ? "bg-black text-white hover:bg-black/90 animate-pulse" : "bg-black/90 text-white hover:bg-black"
                                    }`}
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                {mounted && cartTotal > 0 ? (
                                    <span className="font-bold">
                                        R$ {cartTotal.toFixed(2).replace(".", ",")}
                                    </span>
                                ) : (
                                    <span className="font-bold hidden sm:inline">Carrinho</span>
                                )}

                                {mounted && cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white shadow-sm animate-in zoom-in border-2 border-white">
                                        {cartCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Mobile Search Bar (Below Header) */}
                <div className="md:hidden px-4 pb-3 relative" ref={mobileWrapperRef}>
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="O que você vai beber hoje?"
                            className="w-full h-10 px-4 pl-10 rounded-full text-sm outline-none text-black placeholder:text-gray-500 shadow-sm bg-white"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                        />
                        <button
                            onClick={goToSearchPage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                        >
                            <Search size={16} />
                        </button>
                        {isLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                            </div>
                        )}
                    </div>
                    {/* Mobile Dropdown Results */}
                    {showResults && (
                        <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            {searchResults.length > 0 ? (
                                <>
                                    <ul>
                                        {searchResults.map((product) => (
                                            <li key={product.id}>
                                                <button
                                                    onClick={() => handleProductClick(product)}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                                                >
                                                    <div className="relative w-10 h-10 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                                        {product.image_url ? (
                                                            <Image
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                fill
                                                                className="object-contain p-1"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center w-full h-full text-gray-300">
                                                                <Beer size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={goToSearchPage}
                                        className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-primary-dark transition-colors text-center block border-t border-gray-100"
                                    >
                                        Ver todos os resultados
                                    </button>
                                </>
                            ) : (
                                !isLoading && (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        Nenhum produto encontrado.
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </header>

            <ProductDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                product={selectedProduct}
                onAddToCart={handleDrawerAddToCart}
            />

            {selectedProduct && (
                <ProductExchangeDialog
                    open={isExchangeDialogOpen}
                    onOpenChange={setIsExchangeDialogOpen}
                    product={selectedProduct}
                    onConfirm={confirmExchange}
                />
            )}

            <PostAddCartDialog
                open={isPostAddDialogOpen}
                onOpenChange={setIsPostAddDialogOpen}
                onContinue={() => setIsPostAddDialogOpen(false)}
                onReview={() => {
                    setIsPostAddDialogOpen(false);
                    router.push('/checkout');
                }}
            />
        </>
    );
}


