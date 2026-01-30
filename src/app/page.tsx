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
        product:products(*)
      )
    `)
    .eq('active', true)
    .eq('featured', true);

  // Fetch all products (still needed for existing logic or fallback)
  const { data: products } = await supabase
    .from('products')
    .select('*')
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

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen flex flex-col transition-colors duration-200 font-sans">
      <Header />


      <main className="flex-grow pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 mt-6">

          {/* Buy Again (Client Component) */}
          <BuyAgainSection />

          {/* Coupon Banner */}
          {sectionsMap['coupon']?.active && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full shrink-0">
                <span className="text-green-700 dark:text-green-300 font-bold text-xl">{sectionsMap['coupon'].config?.icon || '🏷️'}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800 dark:text-green-300">{sectionsMap['coupon'].config?.title || "Cupom de frete grátis na 1ª compra!"}</h3>
                <p className="text-sm text-green-700 dark:text-green-400">{sectionsMap['coupon'].config?.subtitle || "Aproveite para pedir suas bebidas favoritas."}</p>
              </div>
              <ChevronRight className="text-green-700 dark:text-green-300 w-5 h-5" />
            </div>
          )}

          {/* Categories Grid */}
          {sectionsMap['categories']?.active && <CategoriesGrid title={sectionsMap['categories'].config?.title} />}

          {/* Featured Products (Horizontal Scroll) - Now Dynamic */}
          {featuredCollections && featuredCollections.length > 0 ? (
            (() => {
              const mainCollection = featuredCollections[0];
              const displayItems = mainCollection.collection_items?.map((i: any) => i.product).filter(Boolean) || [];

              return (
                <section className="bg-primary rounded-3xl p-6 md:p-10 relative overflow-hidden">
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
            })()
          ) : (
            /* Fallback to generic products if no collection is configured */
            <section className="bg-primary rounded-3xl p-6 md:p-10 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              <div className="absolute -right-10 bottom-0 h-64 w-64 bg-yellow-500 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className="md:w-1/4">
                  <h2 className="text-3xl font-black text-black leading-tight uppercase mb-2">Produtos em Destaque</h2>
                  <p className="text-black font-medium mb-6">Para sua 1ª compra</p>
                  <Button className="bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-gray-900 transition-colors h-auto">Ver todos</Button>
                </div>
                <div className="flex-1 w-full overflow-x-auto no-scrollbar pb-4">
                  <div className="flex gap-4">
                    {highlights.map(product => (
                      <div key={product.id} className="min-w-[180px] w-[180px]">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Summer Offers (Banners) */}
          {/* Dynamic Banners Section */}
          {banners && banners.length > 0 && (
            <section>
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
          )}

          {/* Dynamic Featured Collections (Remaining) */}
          {featuredCollections && featuredCollections.slice(1).map(collection => (
            collection.collection_items && collection.collection_items.length > 0 && (
              <section key={collection.id}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{collection.title}</h2>
                  <Link href={`/colecao/${collection.slug}`} className="text-gray-500 dark:text-gray-400 text-sm font-semibold hover:text-primary transition-colors flex items-center">
                    Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {collection.collection_items.slice(0, 5).map((item: any) => (
                    item.product && <ProductCard key={item.product.id} product={item.product} />
                  ))}
                </div>
              </section>
            )
          ))}

          {/* Recommended (Dynamic from Spirits/Beers) */}
          {sectionsMap['recommended']?.active && spirits.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{sectionsMap['recommended'].config?.title || "Recomendados pelo Ady"}</h2>
                <a href="#" className="text-gray-500 dark:text-gray-400 text-sm font-semibold hover:text-primary transition-colors flex items-center">
                  Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {spirits.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Beers */}
          {sectionsMap['beers']?.active && beers.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{sectionsMap['beers'].config?.title || "Cervejas Geladas"}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {beers.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Carnaval Banner */}
          {sectionsMap['carnaval']?.active && (
            <section className="rounded-xl overflow-hidden relative h-48 md:h-64 flex items-center bg-gradient-to-r from-red-600 to-red-800">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
              {sectionsMap['carnaval'].config?.image_url ? (
                // Custom Image Background if configured, or just use overlay layout
                <div className="relative z-10 px-8 md:px-16 w-full flex items-center justify-between">
                  <div className="text-white max-w-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-8 bg-primary rounded-full flex items-center justify-center text-black">
                        <div className="font-bold text-lg">ADY</div>
                      </div>
                      <h2 className="text-lg font-bold">Distribuidora do Ady</h2>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase leading-none mb-2 italic" dangerouslySetInnerHTML={{ __html: (sectionsMap['carnaval'].config?.title || "Bora Garantir<br />O Chopp").replace(/\n/g, '<br />') }}></h2>
                    <div className="bg-white text-red-700 font-bold px-2 py-1 inline-block text-sm uppercase">{sectionsMap['carnaval'].config?.subtitle || "Do Carnaval"}</div>
                    <div className="mt-4">
                      <button className="bg-yellow-500 hover:bg-yellow-400 text-red-900 font-black px-6 py-2 rounded shadow-lg uppercase tracking-wide transition-colors">{sectionsMap['carnaval'].config?.button_text || "Aproveitar!"}</button>
                    </div>
                  </div>
                  {sectionsMap['carnaval'].config?.image_url && <img alt="Banner" className="hidden md:block h-64 w-64 object-cover rounded-full border-4 border-white shadow-2xl transform rotate-3 translate-y-4" src={sectionsMap['carnaval'].config?.image_url} />}
                </div>
              ) : (
                // Fallback Layout
                <div className="relative z-10 px-8 md:px-16 w-full flex items-center justify-between">
                  <div className="text-white max-w-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-8 bg-primary rounded-full flex items-center justify-center text-black">
                        <div className="font-bold text-lg">ADY</div>
                      </div>
                      <h2 className="text-lg font-bold">Distribuidora do Ady</h2>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase leading-none mb-2 italic">Bora Garantir<br />O Chopp</h2>
                    <div className="bg-white text-red-700 font-bold px-2 py-1 inline-block text-sm uppercase">Do Carnaval</div>
                    <div className="mt-4">
                      <button className="bg-yellow-500 hover:bg-yellow-400 text-red-900 font-black px-6 py-2 rounded shadow-lg uppercase tracking-wide transition-colors">Aproveitar!</button>
                    </div>
                  </div>
                  <img alt="Chopp" className="hidden md:block h-64 w-64 object-cover rounded-full border-4 border-white shadow-2xl transform rotate-3 translate-y-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0b2FLtaELylN6aUD6iXdWZUxV_jKXj-uN2pY_S08ub4YcmsFwt2QyE74FmNW8wObYPS2Tr4Mjm2GhCZPDqP6yEJHTDKdTydkeM5XVmjQ9xjrlOQH2ZnqdVjWa1UsVkIBebZ6EnCP7dJ1wKT2Uc2DZzI5QJVxhA8yZdZz_IDblr2jwApM58rH4hqMGiPv2KcYdq2Vo2TIDVMwoP1S_p-WTC26mH4JvSldYGFaH1RWUlGQh8KOGPbnidUCpBE70uXvBQu_00poD7cOl" />
                </div>
              )}
            </section>
          )}



          {/* Brands Grid */}
          {sectionsMap['brands']?.active && <BrandsGrid title={sectionsMap['brands'].config?.title} />}

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
