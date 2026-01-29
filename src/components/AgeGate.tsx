"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Beer } from "lucide-react";

export function AgeGate() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDenied, setIsDenied] = useState(false);

    useEffect(() => {
        const passed = localStorage.getItem("age-gate-passed");
        if (!passed) {
            setIsVisible(true);
        }
    }, []);

    const handleYes = () => {
        localStorage.setItem("age-gate-passed", "true");
        setIsVisible(false);
    };

    const handleNo = () => {
        setIsDenied(true);
    };

    if (!isVisible && !isDenied) return null;

    return (
        <AnimatePresence>
            {(isVisible || isDenied) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-2xl text-center"
                    >
                        {isDenied ? (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-destructive">
                                    Acesso Negado
                                </h2>
                                <p className="text-muted-foreground">
                                    Você precisa ter 18 anos ou mais para acessar este site.
                                </p>
                                <Button variant="outline" onClick={() => window.location.href = 'https://google.com'}>
                                    Sair
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 bg-primary/20 rounded-full">
                                        <Beer className="w-12 h-12 text-primary" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">
                                    Você tem mais de 18 anos?
                                </h2>
                                <p className="text-muted-foreground">
                                    A venda de bebidas alcoólicas é proibida para menores de 18
                                    anos.
                                </p>
                                <div className="flex gap-4 justify-center pt-4">
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        onClick={handleNo}
                                        className="w-32"
                                    >
                                        Não
                                    </Button>
                                    <Button size="lg" onClick={handleYes} className="w-32 font-bold">
                                        Sim
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
