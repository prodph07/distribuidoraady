
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface CategoryConfig {
    dbCategories: string[];
    keywords: string[];
    brands: string[];
    title: string;
}

const SECTIONS_CONFIG: Record<string, CategoryConfig> = {
    'cervejas': {
        dbCategories: ['Cervejas', 'Cerveja'],
        keywords: ['cerveja'],
        brands: ['Brahma', 'Skol', 'Corona', 'Heineken', 'Antarctica', 'Budweiser', 'Spaten', 'Amstel', 'Stella', 'Becks', 'Original', 'Bohemia', 'Itaipava', 'Kaiser'],
        title: 'Cervejas Geladas'
    },
    'vinhos': {
        dbCategories: ['Vinhos', 'Vinho'],
        keywords: ['vinho'],
        brands: ['Sangue de Boi', 'Pergola', 'Casillero', 'Reservado', 'Concha y Toro', 'Chalise', 'Galiotto', 'Mioranza', 'Cantina da Serra'],
        title: 'Vinhos Selecionados'
    },
    'destilados': {
        dbCategories: ['Destilados', 'Destilado', 'Whisky', 'Vodka', 'Gin', 'Licor', 'Cachaça', 'Rum', 'Tequila'],
        keywords: ['destilado', 'whisky', 'vodka', 'gin', 'licor', 'cachaça', 'rum', 'tequila'],
        brands: ['Smirnoff', 'Absolut', 'Jack Daniels', 'Red Label', 'Black Label', 'White Horse', 'Tanqueray', 'Beats', '51', 'Velho Barreiro', 'Ypioca', 'Campari', 'Ballantines', 'Chivas', 'Old Parr'],
        title: 'Destilados & Drinks'
    },
    'sem-alcool': {
        dbCategories: ['Sem Álcool', 'Água', 'Refrigerante', 'Energético', 'Suco', 'Chá'],
        keywords: ['água', 'refrigerante', 'energético', 'suco', 'sem álcool', 'chá'],
        brands: ['Coca-Cola', 'Coca Cola', 'Pepsi', 'Guaraná', 'Antarctica', 'Red Bull', 'Monster', 'Crystal', 'Prata', 'Schweppes', 'Sprite', 'Fanta', 'Sukita'],
        title: 'Sem Álcool'
    },
    'petiscos': {
        dbCategories: ['Petiscos', 'Salgadinho', 'Bomboniere', 'Alimentos'],
        keywords: ['petisco', 'amendoim', 'salgadinho', 'batata', 'chocolate', 'bala'],
        brands: ['Elma Chips', 'Torcida', 'Pringles', 'Amendupã', 'Nestlé', 'Garoto', 'Lacta', 'Snickers', 'Trident'],
        title: 'Para Acompanhar'
    },
    'outros': {
        dbCategories: [], // Special case: fetches everything else or generic
        keywords: [],
        brands: [],
        title: 'Outros Produtos'
    }
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const config = SECTIONS_CONFIG[slug];

    if (!config) {
        // If it's not a predefined category, maybe try to match generically or 404
        // For now, let's treat unknown slugs as generic searches or 404
        // check if 'outros' logic matches
        if (slug !== 'outros') return notFound();
    }

    // Fetch all products first
    // In a real app with many products, we should filter in DB.
    // However, exact textual match is tricky without normalized DB.
    // We'll fetch all active products and filter in memory for better accuracy with this schema.
    const { data: allProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('name');

    if (error || !allProducts) {
        console.error("Error fetching products", error);
        return <div>Erro ao carregar produtos.</div>;
    }

    let categoryProducts: Product[] = [];

    if (slug === 'outros') {
        // Filter products that DO NOT belong to other known categories
        const knownKeywords = Object.values(SECTIONS_CONFIG)
            .filter(c => c !== SECTIONS_CONFIG['outros'])
            .flatMap(c => c.keywords);

        categoryProducts = allProducts.filter(p => {
            const lowerName = p.name.toLowerCase();
            const lowerCat = p.category?.toLowerCase() || '';
            // If category matches a known dbCategory, exclude it
            const isKnownCat = Object.values(SECTIONS_CONFIG).some(c =>
                c.dbCategories.some(dbCat => lowerCat.includes(dbCat.toLowerCase()))
            );
            if (isKnownCat) return false;

            // If name contains a strong keyword for another category, maybe exclude? (Optional, might be risky)
            // For simplicity, mostly rely on Category field if present, or fallback to 'Outros' bucket.
            return true;
        });
    } else {
        // Filter by DB Category OR Keywords
        categoryProducts = allProducts.filter(p => {
            const lowerName = p.name.toLowerCase();
            const lowerCat = p.category?.toLowerCase() || '';

            // 1. Check DB Category Match
            const catMatch = config.dbCategories.some(dbCat => lowerCat.includes(dbCat.toLowerCase()));
            if (catMatch) return true;

            // 2. Check Name Keywords Match (if category is empty or generic)
            if (!p.category || p.category.trim() === '') {
                // Only check keywords if no category is assigned to avoid mis-categorizing
                return config.keywords.some(k => lowerName.includes(k.toLowerCase()));
            }

            // If category exists but doesn't match, check keywords cautiously?
            // "Cerveja sem alcool" -> Category: 'Sem Álcool' or 'Cervejas'?
            // Providing flexible matching:
            return config.keywords.some(k => lowerName.includes(k.toLowerCase()));
        });
    }

    // Now Group by Brand
    const sections: { title: string; products: Product[] }[] = [];
    const usedProductIds = new Set<number>();

    // 1. Create sections for specific brands
    config.brands.forEach(brand => {
        const brandProducts = categoryProducts.filter(p =>
            !usedProductIds.has(p.id) &&
            p.name.toLowerCase().includes(brand.toLowerCase())
        );

        if (brandProducts.length > 0) {
            sections.push({
                title: brand,
                products: brandProducts
            });
            brandProducts.forEach(p => usedProductIds.add(p.id));
        }
    });

    // 2. Collect remaining products
    const remainingProducts = categoryProducts.filter(p => !usedProductIds.has(p.id));

    if (remainingProducts.length > 0) {
        sections.push({
            title: sections.length > 0 ? 'Outras Marcas' : 'Geral',
            products: remainingProducts
        });
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen flex flex-col transition-colors duration-200 font-sans">
            <Header />

            <main className="flex-grow pb-12">
                <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 mt-6">

                    {/* Breadcrumb / Title */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-primary transition-colors flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{config.title}</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black uppercase text-gray-900 dark:text-white mb-8">
                        {config.title}
                    </h1>

                    {sections.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">Nenhum produto encontrado nesta categoria.</p>
                            <Link href="/">
                                <button className="mt-4 bg-primary text-black px-6 py-2 rounded-full font-bold hover:bg-primary-dark transition-colors">
                                    Voltar para o Início
                                </button>
                            </Link>
                        </div>
                    ) : (
                        sections.map((section, idx) => (
                            <section key={idx} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                                        {section.title}
                                    </h2>
                                    <div className="h-px bg-gray-200 dark:bg-gray-800 flex-grow"></div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {section.products.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>
            </main>

            <footer className="bg-surface-dark text-gray-400 py-12 mt-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 md:px-8 text-center text-xs">
                    <p className="mb-2">BEBA COM MODERAÇÃO. VENDA E CONSUMO PROIBIDOS PARA MENORES DE 18 ANOS.</p>
                    <p>© 2024 Distribuidora do Ady. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
