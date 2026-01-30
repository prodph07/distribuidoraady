"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Collection, Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CollectionPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [collection, setCollection] = useState<Collection | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) fetchCollection();
    }, [slug]);

    const fetchCollection = async () => {
        setLoading(true);
        // 1. Get Collection
        const { data: coll } = await supabase.from('collections').select('*').eq('slug', slug).single();

        if (coll) {
            setCollection(coll);
            // 2. Get Items
            const { data: items } = await supabase
                .from('collection_items')
                .select('product_id, products(*)')
                .eq('collection_id', coll.id);

            if (items) {
                // Map joined data
                const mappedProducts = items.map((i: any) => i.products).filter(Boolean);
                setProducts(mappedProducts);
            }
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
                <Header />
                <main className="container mx-auto p-4 space-y-8">
                    <Skeleton className="h-48 w-full rounded-3xl" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
                    </div>
                </main>
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Coleção não encontrada :(</h1>
                <Link href="/" className="text-primary hover:underline">Voltar para Início</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
            <Header />

            <main className="container mx-auto p-4 space-y-8">
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center text-sm text-neutral-500 hover:text-primary transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Voltar
                </Link>

                {/* Banner / Header */}
                <div className="relative rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 min-h-[200px] flex items-center justify-center">
                    {collection.image_url ? (
                        <div className="absolute inset-0">
                            <Image
                                src={collection.image_url}
                                alt={collection.title}
                                fill
                                className="object-cover opacity-50"
                            />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
                    )}

                    <div className="relative z-10 text-center p-6">
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg uppercase tracking-tight">
                            {collection.title}
                        </h1>
                        {collection.description && (
                            <p className="text-neutral-200 max-w-2xl mx-auto">{collection.description}</p>
                        )}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {products.map(product => (
                        <div key={product.id} className="animate-in fade-in zoom-in duration-300">
                            <ProductCard product={product} />
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full py-12 text-center text-neutral-500">
                            Nenhum produto nesta coleção ainda.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
