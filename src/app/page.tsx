import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export const revalidate = 0; // Disable cache for demo purposes
export const runtime = 'edge';

export default async function Home() {
  // Fetch all products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('name'); // Alphabetical for now to mix it up, or by popularity if we had it

  // Filter strategy (Client-side filtering for simplicity on small catalog)
  // Logic: Name search or Category search. Ideally use 'category' column.
  const allProducts = products || [];

  const beers = allProducts.filter(p =>
    (p.category && p.category.toLowerCase().includes('cerveja')) ||
    (!p.category && p.name.toLowerCase().includes('cerveja')) ||
    (!p.category && p.name.toLowerCase().includes('brahma')) ||
    (!p.category && p.name.toLowerCase().includes('heineken'))
  ).slice(0, 6); // Top 6

  const spirits = allProducts.filter(p =>
    (p.category && (p.category.toLowerCase().includes('destilado') || p.category.toLowerCase().includes('vodka') || p.category.toLowerCase().includes('whisky'))) ||
    (!p.category && (p.name.toLowerCase().includes('vodka') || p.name.toLowerCase().includes('whisky') || p.name.toLowerCase().includes('gin')))
  ).slice(0, 6);

  const nonAlcoholic = allProducts.filter(p =>
    (p.category && (p.category.toLowerCase().includes('sem álcool') || p.category.toLowerCase().includes('refrigerante') || p.category.toLowerCase().includes('água'))) ||
    (!p.category && (p.name.toLowerCase().includes('coca') || p.name.toLowerCase().includes('água') || p.name.toLowerCase().includes('guaraná')))
  ).slice(0, 6);

  // Fallback "Destaques" = everything else or random mix
  const highlights = allProducts.slice(0, 10);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">

        {/* Hero Carousel */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Primary Banner */}
          <div className="relative overflow-hidden rounded-xl bg-primary h-64 sm:h-80 flex flex-col justify-center px-8 group cursor-pointer hover:shadow-lg transition-all">
            <div className="relative z-10 max-w-[60%]">
              <h2 className="text-black text-3xl sm:text-4xl font-extrabold leading-tight mb-4">BORA TOMAR UMA?</h2>
              <button className="bg-black text-white px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                Ver Ofertas
              </button>
            </div>
            {/* Decorative Image Placeholder */}
            <div className="absolute right-[-20px] bottom-[-20px] w-[50%] h-[120%] bg-contain bg-no-repeat bg-center opacity-80" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuARW-l60Ouvs-MnZf3dvDE2WkvGbkTxHWfnbcNgV9Dh5k8V7OykO-nO6vDlSJ4lNdLLwqgp-Vz29rAb35xpbKEYLDe_CtUbAei6P_AbkZjCgLzrAkV_1bE09azrwkfEDSeM8LlCHBBEzKigckX_EMYmxj_hnN5YDxoj-ATbbvo_fCrBCZi7yYbZ01TqI7JNIPB_lSj1gQG88pTyu8jhFEKKgeclIvNEZ36_HicAh9zIVlRqK64E5Q-1w3n8c4ZHU-Nn2qlkXRnfaKg7')" }}></div>
          </div>

          {/* Secondary Banner */}
          <div className="relative overflow-hidden rounded-xl bg-[#2a2a2a] h-64 sm:h-80 flex flex-col justify-center px-8 group cursor-pointer hover:shadow-lg transition-all">
            <div className="relative z-10 max-w-[60%]">
              <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">Sustentabilidade</span>
              <h2 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight mb-4">RETORNÁVEL</h2>
              <p className="text-gray-300 text-sm mb-6">Sua bebida gelada, rápido e ajudando o planeta.</p>
              <button className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
                Saiba mais
              </button>
            </div>
            {/* Decorative Image Placeholder */}
            <div className="absolute right-0 top-0 w-1/2 h-full bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity" style={{ backgroundImage: "url('https://placehold.co/400x400/transparent/EEE?text=Bottle')" }}></div>
          </div>
        </section>

        {/* Categories Chips */}
        <section className="overflow-hidden">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {[
              { icon: "sports_bar", label: "Cervejas", active: true },
              { icon: "local_bar", label: "Destilados" },
              { icon: "wine_bar", label: "Vinhos" },
              { icon: "no_drinks", label: "Sem Álcool" },
              { icon: "tapas", label: "Petiscos" },
              { icon: "ac_unit", label: "Gelo" },
              { icon: "local_fire_department", label: "Churrasco" }
            ].map((cat, i) => (
              <button
                key={cat.label}
                className={`flex shrink-0 items-center justify-center gap-2 rounded-full px-5 h-10 font-bold transition-all ${i === 0 // Just highlighting first for demo
                  ? "bg-primary text-black hover:brightness-110"
                  : "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
                  }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* SECTION: COMBOS (Static) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              🔥 Combos da Galera
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-row items-center justify-between cursor-pointer hover:border-primary/50 transition-all group">
              <div className="flex flex-col gap-2">
                <h3 className="text-white text-lg font-bold group-hover:text-primary transition-colors">Esquenta em Casa</h3>
                <p className="text-neutral-400 text-sm max-w-[200px]">6 Brahma Duplo Malte + 1 Saco de Gelo 5kg</p>
                <div className="mt-2 text-primary font-black text-xl">R$ 28,90</div>
              </div>
              <div className="h-24 w-32 bg-contain bg-center bg-no-repeat bg-white/5 rounded-lg border border-white/5"></div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-row items-center justify-between cursor-pointer hover:border-primary/50 transition-all group">
              <div className="flex flex-col gap-2">
                <h3 className="text-white text-lg font-bold group-hover:text-primary transition-colors">Churrasco Completo</h3>
                <p className="text-neutral-400 text-sm max-w-[200px]">12 Heineken + 2kg Carvão + Sal Grosso</p>
                <div className="mt-2 text-primary font-black text-xl">R$ 145,00</div>
              </div>
              <div className="h-24 w-32 bg-contain bg-center bg-no-repeat bg-white/5 rounded-lg border border-white/5"></div>
            </div>
          </div>
        </section>

        {/* SECTION: BEERS */}
        {beers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                🍻 Cervejas Geladas
              </h2>
              <a className="text-primary text-sm font-bold hover:underline cursor-pointer">Ver todas</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {beers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* SECTION: SPIRITS */}
        {spirits.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                🥃 Destilados & Drinks
              </h2>
              <a className="text-primary text-sm font-bold hover:underline cursor-pointer">Ver todos</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {spirits.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* SECTION: NON-ALCOHOLIC */}
        {nonAlcoholic.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                🥤 Sem Álcool
              </h2>
              <a className="text-primary text-sm font-bold hover:underline cursor-pointer">Ver todos</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {nonAlcoholic.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* SECTION: ALL / HIGHLIGHTS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              ⭐ Destaques da Região
            </h2>
            <a className="text-primary text-sm font-bold hover:underline cursor-pointer">Ver todos</a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {!highlights || highlights.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-card rounded-2xl border-dashed border-2 border-muted">
                <p className="text-muted-foreground font-medium">Nenhum produto disponível no momento.</p>
              </div>
            ) : (
              highlights.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </section>

      </main>

      <footer className="bg-[#0f0e0a] text-[#bab59c] py-12 border-t border-[#393628]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 text-white mb-4">
                <div className="size-8 bg-primary rounded-full flex items-center justify-center text-black">
                  <div className="font-bold text-lg">ZÉ</div>
                </div>
                <h2 className="text-lg font-bold">Zé Delivery</h2>
              </div>
              <p className="text-sm max-w-sm mb-4">
                O maior aplicativo de entrega de bebidas do Brasil. Sua bebida gelada, a preço de mercado e na sua porta rapidinho.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Ajuda</h3>
              <ul className="space-y-2 text-sm">
                <li><a className="hover:text-white" href="#">Central de ajuda</a></li>
                <li><a className="hover:text-white" href="#">Meus pedidos</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[#393628] text-xs text-center md:text-left">
            <p>© 2024 Zé Delivery Inspired. Todos os direitos reservados.</p>
            <p className="mt-2 text-[#6b6652]">BEBA COM MODERAÇÃO. VENDA PROIBIDA PARA MENORES DE 18 ANOS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
