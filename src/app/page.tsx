import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { BuyAgainSection } from "@/components/BuyAgainSection";
import { CategoriesGrid } from "@/components/CategoriesGrid";
import { BrandsGrid } from "@/components/BrandsGrid";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, MapPin, Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 0; // Disable cache for demo purposes
export const runtime = 'edge';

import { ProductCarousel } from "@/components/ProductCarousel";

export default async function Home() {
  // Fetch Home Sections Configuration
  const { data: homeSectionsData } = await supabase
    .from('home_sections')
    .select('*');

  const sectionsMap = (homeSectionsData || []).reduce((acc: any, section: any) => {
    acc[section.slug] = section;
    return acc;
  }, {});

  // Fetch Banners (Only Banner 1 and Banner 2)
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .in('link_url', ['/colecao/banner1', '/colecao/banner2'])
    .order('order_index');

  // Fetch Featured Collections with their products (limit 5 per collection)
  const { data: featuredCollections } = await supabase
    .from('collections')
    .select(`
      *,
      collection_items(
        product:products(*, calculated_stock)
      )
    `)
    .eq('active', true)
    .eq('featured', true);

  // Fetch all products (still needed for existing logic or fallback)
  const { data: products } = await supabase
    .from('products')
    .select('*, calculated_stock')
    .eq('in_stock', true)
    .order('name');

  const allProducts = products || [];

  // Helper for dynamic filtering
  // Helper for dynamic filtering
  const filterByKeywordsOrIds = (keywords: string[], productIds?: number[]) => {
    if (productIds && productIds.length > 0) {
      // Manual selection mode: Return specific products, preserving order if possible or just inclusion
      return allProducts.filter(p => productIds.includes(p.id));
    }

    return allProducts.filter(p =>
      keywords.some(k =>
        (p.category && p.category.toLowerCase().includes(k.toLowerCase())) ||
        (!p.category && p.name.toLowerCase().includes(k.toLowerCase()))
      )
    ).slice(0, 5);
  };

  // Beers Logic
  const beerConfig = sectionsMap['beers']?.config || {};
  const beerKeywords = beerConfig.keywords || ['cerveja', 'brahma', 'heineken'];
  const beerProductIds = beerConfig.product_ids;
  const beers = filterByKeywordsOrIds(beerKeywords, beerProductIds);

  // Spirits/Recommended Logic
  const spiritsConfig = sectionsMap['recommended']?.config || {};
  const spiritsKeywords = spiritsConfig.keywords || ['destilado', 'vodka', 'whisky', 'gin'];
  const spiritsProductIds = spiritsConfig.product_ids;
  const spirits = filterByKeywordsOrIds(spiritsKeywords, spiritsProductIds);

  const highlights = allProducts.slice(0, 10);

  // Sort sections by order_index
  const sortedSections = (homeSectionsData || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

  // Helper to render sections
  const renderSection = (section: any) => {
    if (!section.active) return null;

    // 0. Hero (Banner Principal)
    if (section.slug === 'hero') {
      const mainCollection = featuredCollections && featuredCollections.length > 0 ? featuredCollections[0] : null;
      if (!mainCollection) return null; // Or render fallback?

      const displayItems = mainCollection.collection_items?.map((i: any) => i.product).filter(Boolean) || [];

      return (
        <section key={section.slug} className="bg-primary rounded-3xl p-6 md:p-10 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
          <div className="absolute -right-10 bottom-0 h-64 w-64 bg-yellow-500 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="md:w-1/4">
              <h2 className="text-3xl font-black text-black leading-tight uppercase mb-2">{mainCollection.title}</h2>
              <p className="text-black font-medium mb-6">{mainCollection.description || "Confira nossa seleção especial"}</p>
              <Link href={`/colecao/${mainCollection.slug}`}>
                <Button className="bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-gray-900 transition-colors h-auto">Ver todos</Button>
              </Link>
            </div>
            <div className="flex-1 w-full overflow-x-auto no-scrollbar pb-4">
              <div className="flex gap-4">
                {displayItems.slice(0, 10).map((product: any) => (
                  <div key={product.id} className="min-w-[180px] w-[180px]">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    }

    // 0.5 Banners (Grid Duplo)
    if (section.slug === 'banners') {
      if (!banners || banners.length === 0) return null;
      return (
        <section key={section.slug}>
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Destaques</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {banners.map(banner => (
              <Link key={banner.id} href={banner.link_url || '#'} className="block">
                <div className="bg-gray-100 dark:bg-surface-dark rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow h-48">
                  <div className="z-10 relative max-w-[60%]">
                    <span className="bg-green-700 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">CONFIRA</span>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">{banner.title}</h3>
                    <div className="bg-primary text-black p-2 rounded-full mt-2 w-fit group-hover:bg-primary-dark transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                  <img
                    alt={banner.title || 'Banner'}
                    className="h-40 object-contain transform rotate-3 group-hover:scale-110 transition-transform duration-300 absolute -right-2 top-4"
                    src={banner.image_url}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    // 1. Coupon
    if (section.slug === 'coupon') {
      return (
        <div key={section.slug} className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full shrink-0">
            <span className="text-green-700 dark:text-green-300 font-bold text-xl">{section.config?.icon || '🏷️'}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-green-800 dark:text-green-300">{section.config?.title || "Cupom de frete grátis na 1ª compra!"}</h3>
            <p className="text-sm text-green-700 dark:text-green-400">{section.config?.subtitle || "Aproveite para pedir suas bebidas favoritas."}</p>
          </div>
          <ChevronRight className="text-green-700 dark:text-green-300 w-5 h-5" />
        </div>
      );
    }

    // 2. Categories
    if (section.slug === 'categories') {
      return (
        <CategoriesGrid
          key={section.slug}
          title={section.config?.title}
          categories={section.config?.categories}
        />
      );
    }

    // 3. Carousel Logic
    if (section.slug.startsWith('carousel-') || section.slug === 'recommended' || section.slug === 'beers') {
      const config = section.config || {};
      const keywords = config.keywords || [];
      const productIds = config.product_ids;

      // Logic to get products
      let sectionProducts: any[] = [];
      if (productIds && productIds.length > 0) {
        sectionProducts = allProducts.filter(p => productIds.includes(p.id));
      } else if (keywords.length > 0) {
        sectionProducts = allProducts.filter(p =>
          keywords.some((k: string) =>
            (p.category && p.category.toLowerCase().includes(k.toLowerCase())) ||
            (!p.category && p.name.toLowerCase().includes(k.toLowerCase()))
          )
        ).slice(0, 10);
      }

      // Fallbacks
      if (section.slug === 'recommended' && sectionProducts.length === 0) {
        sectionProducts = spirits;
      }
      if (section.slug === 'beers' && sectionProducts.length === 0) {
        sectionProducts = beers;
      }

      if (sectionProducts.length === 0) return null;

      return (
        <ProductCarousel
          key={section.slug}
          title={config.title || section.name}
          products={sectionProducts}
          viewAllLink={config.view_all_link || "#"}
        />
      );
    }

    // 4. Carnaval
    if (section.slug === 'carnaval') {
      return (
        <section key={section.slug} className="rounded-xl overflow-hidden relative h-48 md:h-64 flex items-center bg-gradient-to-r from-red-600 to-red-800">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
          {section.config?.image_url ? (
            <div className="relative z-10 px-8 md:px-16 w-full flex items-center justify-between">
              <div className="text-white max-w-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 bg-primary rounded-full flex items-center justify-center text-black">
                    <div className="font-bold text-lg">ADY</div>
                  </div>
                  <h2 className="text-lg font-bold">Distribuidora do Ady</h2>
                </div>
                <h2 className="text-3xl md:text-5xl font-black uppercase leading-none mb-2 italic" dangerouslySetInnerHTML={{ __html: (section.config?.title || "Bora Garantir<br />O Chopp").replace(/\n/g, '<br />') }}></h2>
                <div className="bg-white text-red-700 font-bold px-2 py-1 inline-block text-sm uppercase">{section.config?.subtitle || "Do Carnaval"}</div>
                <div className="mt-4">
                  <button className="bg-yellow-500 hover:bg-yellow-400 text-red-900 font-black px-6 py-2 rounded shadow-lg uppercase tracking-wide transition-colors">{section.config?.button_text || "Aproveitar!"}</button>
                </div>
              </div>
              <img alt="Banner" className="hidden md:block h-64 w-64 object-cover rounded-full border-4 border-white shadow-2xl transform rotate-3 translate-y-4" src={section.config?.image_url} />
            </div>
          ) : (
            <div className="relative z-10 px-8 md:px-16 w-full flex items-center justify-between">
              <div className="text-white max-w-lg">
                <h2 className="text-3xl md:text-5xl font-black uppercase leading-none mb-2 italic">Bora Garantir<br />O Chopp</h2>
              </div>
            </div>
          )}
        </section>
      );
    }

    // 5. Brands
    if (section.slug === 'brands') {
      return <BrandsGrid key={section.slug} title={section.config?.title} />;
    }

    return null;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen flex flex-col transition-colors duration-200 font-sans">
      <Header />

      <main className="flex-grow pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 mt-6">

          {/* Buy Again (Always Top?) - Client Component often sits at top */}
          <BuyAgainSection />

          {/* Banners (Destaques) - Usually fixed at top, but could be dynamic if we added a 'banners' section to DB. 
              For now, let's keep it fixed as per typical layout, or move it if user asked? 
              User asked to move "carousels". Banners usually stay top. Let's keep banners here. */}

          {/* Featured Collections [0] (Big Highlight) */}
          {/* This was the big "Product Highlight" block. We can keep it fixed or make it dynamic if we had a section for it. 
              Let's keep it fixed for now as "Hero" content unless user explicitly wants to move the Hero. */}


          {/* Dynamic Banners Section (Smaller 2-grid) */}


          {/* DYNAMIC SECTIONS RENDER */}
          {sortedSections.map(renderSection)}

          {/* Remaining Featured Collections (If any, appended at end or logic needs to shift?) 
              Previously these were static at bottom. 
              Ideally, "Featured Collections" should be managed as sections too to be reorderable. 
              But for now, to avoid breaking, let's keep them here, or maybe user wants to control them?
              User said "change sequence". 
              Let's just leave them at the bottom for now as "Extras". */}
          {featuredCollections && featuredCollections.slice(1).map(collection => (
            collection.collection_items && collection.collection_items.length > 0 && (
              <ProductCarousel
                key={collection.id}
                title={collection.title}
                products={collection.collection_items.map((item: any) => item.product).filter(Boolean)}
                viewAllLink={`/colecao/${collection.slug}`}
              />
            )
          ))}

        </div>
      </main>

      {/* WhatsApp FAB */}
      <a
        href="https://wa.me/5511999999999?text=Quero%20entrar%20na%20lista%20VIP%20de%20ofertas!"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform animate-in zoom-in spin-in-3"
        title="Receber Ofertas no Zap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 12a9 9 0 1 1 2.9 6.8L3 21l2.4-2.4A9 9 0 0 1 2.5 12z" /><path d="M12 12h.01" /><path d="M8 8.5h.01" /><path d="M16 8.5h.01" /><path d="M12 15.5h.01" /><path d="M8 15.5h.01" /><path d="M16 15.5h.01" /></svg>
      </a>

      {/* Footer */}
      <footer className="bg-surface-dark text-gray-400 py-12 mt-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Sobre a Distribuidora</h3>
              <ul className="space-y-2 text-sm">
                <li><Link className="hover:text-primary" href="#">Quem somos</Link></li>
                <li><Link className="hover:text-primary" href="#">Cidades atendidas</Link></li>
                <li><Link className="hover:text-primary" href="#">Trabalhe conosco</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Parcerias</h3>
              <ul className="space-y-2 text-sm">
                <li><Link className="hover:text-primary" href="#">Quero ser parceiro</Link></li>
                <li><Link className="hover:text-primary" href="#">Área do entregador</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Ajuda</h3>
              <ul className="space-y-2 text-sm">
                <li><Link className="hover:text-primary" href="#">Central de ajuda</Link></li>
                <li><Link className="hover:text-primary" href="#">Política de privacidade</Link></li>
                <li><Link className="hover:text-primary" href="#">Termos de uso</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Social</h3>
              <div className="flex gap-4">
                <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary hover:text-black transition-colors cursor-pointer">IG</div>
                <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary hover:text-black transition-colors cursor-pointer">TW</div>
                <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary hover:text-black transition-colors cursor-pointer">FB</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-xs text-center">
            <p className="mb-2">BEBA COM MODERAÇÃO. VENDA E CONSUMO PROIBIDOS PARA MENORES DE 18 ANOS.</p>
            <p>© 2024 Distribuidora do Ady. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
