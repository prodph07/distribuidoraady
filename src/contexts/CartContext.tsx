"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "@/types";

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity: number, hasExchange: boolean) => void;
    removeFromCart: (productId: number, hasExchange: boolean) => void;
    cartTotal: number;
    cartCount: number;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load from local storage on mount (optional)
    useEffect(() => {
        const saved = localStorage.getItem("cart");
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(items));
    }, [items]);

    const addToCart = (product: Product, quantity: number, hasExchange: boolean) => {
        setItems((prev) => {
            const existing = prev.find(
                (i) => i.id === product.id && i.has_exchange === hasExchange
            );
            if (existing) {
                return prev.map((i) =>
                    i.id === product.id && i.has_exchange === hasExchange
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            }
            return [...prev, { ...product, quantity, has_exchange: hasExchange }];
        });
    };

    const removeFromCart = (productId: number, hasExchange: boolean) => {
        setItems((prev) =>
            prev.filter((i) => !(i.id === productId && i.has_exchange === hasExchange))
        );
    };

    const cartTotal = items.reduce((total, item) => {
        const unitPrice = item.has_exchange || !item.is_returnable
            ? item.price
            : item.price + item.deposit_price;
        return total + unitPrice * item.quantity;
    }, 0);

    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const clearCart = () => setItems([]);

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
