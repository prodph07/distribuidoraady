import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/ProductCard";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Product } from "@/types";

export const revalidate = 0;
export const runtime = 'edge';

interface SearchPageProps {
    searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.q || "";

    let products: Product[] = [];

    if (query) {
        const { data } = await supabase
            .from("products")
            .select("*, calculated_stock")
            .eq("in_stock", true)
            .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
            .order("name");

        products = (data as Product[]) || [];
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-sans transition-colors duration-200">
            {/* Reusing existing Header */}
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-black mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Voltar para o início
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">
                            {query ? `Resultados para "${query}"` : "Busca"}
                        </h1>
                        <p className="text-muted-foreground">
                            {products.length} {products.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                        </p>
                    </div>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                            <SearchX className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Nenhum produto encontrado
                        </h2>
                        <p className="text-gray-500 max-w-sm mb-6">
                            Não encontramos nada com "{query}". Tente buscar por termos mais genéricos como "cerveja", "água" ou "vodka".
                        </p>
                        <Link href="/">
                            <Button>Voltar as compras</Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
