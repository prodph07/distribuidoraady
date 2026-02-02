
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface BrandConfig {
    name: string;
    keywords: string[];
    description: string;
}

const BRAND_CONFIG: Record<string, BrandConfig> = {
    'brahma': {
        name: 'Brahma',
        keywords: ['brahma'],
        description: 'A autêntica cerveja brasileira, com mais de 130 anos de história.'
    },
    'corona': {
        name: 'Corona',
        keywords: ['corona'],
        description: 'A cerveja mexicana mais famosa do mundo. Ideal com limão.'
    },
    'skol': {
        name: 'Skol',
        keywords: ['skol'],
        description: 'A cerveja que desce redondo. Perfeita para os dias quentes.'
    },
    'tanqueray': {
        name: 'Tanqueray',
        keywords: ['tanqueray'],
        description: 'O Gin inconfundível. Perfeito para o seu Gin Tônica.'
    },
    'beats': {
        name: 'Beats',
        keywords: ['beats', 'skol beats', 'gt', 'senses'],
        description: 'A bebida pronta da balada. Sabores surpreendentes.'
    },
    'johnnie-walker': {
        name: 'Johnnie Walker',
        keywords: ['johnnie walker', 'red label', 'black label', 'blue label', 'gold label', 'green label'],
        description: 'Keep Walking. O Whisky escocês número 1 do mundo.'
    }
};

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Normalize slug to find config (handle potential case sensitivity generally, but config keys are lowercase)
    const config = BRAND_CONFIG[slug.toLowerCase()];

    if (!config) {
        return notFound();
    }

    // Fetch all products
    const { data: allProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('name');

    if (error || !allProducts) {
        console.error("Error fetching products", error);
        return <div>Erro ao carregar produtos.</div>;
    }

    // Filter products by Brand Keywords
    const brandProducts = allProducts.filter(p => {
        const lowerName = p.name.toLowerCase();
        // Check if any keyword matches
        return config.keywords.some(k => lowerName.includes(k.toLowerCase()));
    });

    // Bucket definitions
    const buckets = {
        packs: {
            title: 'Fardos e Caixas',
            products: [] as Product[],
            keywords: ['fardo', 'pack', 'caixa', 'cx']
        },
        returnables: {
            title: 'Garrafas Retornáveis',
            products: [] as Product[],
            keywords: ['retornavel', 'retornável', 'romarinho', 'litrão', 'litrao', '600ml']
        },
        cans: {
            title: 'Latas',
            products: [] as Product[],
            keywords: ['lata', 'latinha', '269', '350', '473', '269ml', '350ml', '473ml']
        },
        bottles: {
            title: 'Garrafas e Long Necks',
            products: [] as Product[],
            keywords: ['long neck', 'garrafa', 'ln', '330', '355', '275']
        },
        others: {
            title: 'Outros',
            products: [] as Product[]
        }
    };

    // Sort products into buckets
    brandProducts.forEach(p => {
        const lowerName = p.name.toLowerCase();

        // Priority 1: Fardos (Packs usually contain other keywords like 'lata', so check this first)
        if (buckets.packs.keywords.some(k => lowerName.includes(k))) {
            buckets.packs.products.push(p);
            return;
        }

        // Priority 2: Returnables (Check DB flag or typical keywords)
        if (p.is_returnable || buckets.returnables.keywords.some(k => lowerName.includes(k))) {
            buckets.returnables.products.push(p);
            return;
        }

        // Priority 3: Cans
        if (buckets.cans.keywords.some(k => lowerName.includes(k))) {
            buckets.cans.products.push(p);
            return;
        }

        // Priority 4: Other Bottles
        if (buckets.bottles.keywords.some(k => lowerName.includes(k))) {
            buckets.bottles.products.push(p);
            return;
        }

        // Fallback
        buckets.others.products.push(p);
    });

    const sectionsToRender = [
        buckets.packs,
        buckets.returnables,
        buckets.bottles,
        buckets.cans,
        buckets.others
    ].filter(section => section.products.length > 0);

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
                        <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{config.name}</span>
                    </div>

                    <div className="bg-surface-dark bg-opacity-5 rounded-3xl p-8 mb-8 text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-black uppercase text-gray-900 dark:text-white mb-4">
                            {config.name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl">
                            {config.description}
                        </p>
                    </div>

                    {brandProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">Nenhum produto da marca <strong>{config.name}</strong> encontrado no momento.</p>
                            <Link href="/">
                                <button className="mt-4 bg-primary text-black px-6 py-2 rounded-full font-bold hover:bg-primary-dark transition-colors">
                                    Explorar outras marcas
                                </button>
                            </Link>
                        </div>
                    ) : (
                        sectionsToRender.map((section, idx) => (
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
