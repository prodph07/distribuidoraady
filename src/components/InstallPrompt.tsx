"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

        // Check if already in standalone mode (installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isIosDevice && !isStandalone) {
            setIsIOS(true);
            // Delay showing on iOS to not be intrusive immediately
            setTimeout(() => setIsVisible(true), 2000);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-full duration-500">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg h-fit">
                            <Download className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Instalar Aplicativo</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                {isIOS
                                    ? "Instale o app para facilitar seus pedidos!"
                                    : "Instale nosso app para uma experiência melhor e mais rápida!"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isIOS ? (
                    <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-md border border-zinc-100 dark:border-zinc-700">
                        <p className="mb-2 font-medium">Para instalar no iPhone/iPad:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Toque no botão <span className="inline-flex items-center"><Share className="w-3 h-3 mx-1" /> Compartilhar</span></li>
                            <li>Role para baixo e toque em <span className="font-semibold">Adicionar à Tela de Início</span></li>
                        </ol>
                        <Button
                            variant="outline"
                            className="w-full mt-3"
                            onClick={handleDismiss}
                        >
                            Entendi
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2 mt-1">
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={handleInstallClick}
                        >
                            Instalar Agora
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleDismiss}
                        >
                            Agora não
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
