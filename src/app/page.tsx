import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, MapPin, Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 0; // Disable cache for demo purposes
export const runtime = 'edge';

export default async function Home() {
  // Fetch all products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('name');

  const allProducts = products || [];

  // Filter strategy
  const beers = allProducts.filter(p =>
    (p.category && p.category.toLowerCase().includes('cerveja')) ||
    (!p.category && p.name.toLowerCase().includes('cerveja')) ||
    (!p.category && p.name.toLowerCase().includes('brahma')) ||
    (!p.category && p.name.toLowerCase().includes('heineken'))
  ).slice(0, 5); // Limit to 5 for the new grid

  const spirits = allProducts.filter(p =>
    (p.category && (p.category.toLowerCase().includes('destilado') || p.category.toLowerCase().includes('vodka') || p.category.toLowerCase().includes('whisky'))) ||
    (!p.category && (p.name.toLowerCase().includes('vodka') || p.name.toLowerCase().includes('whisky') || p.name.toLowerCase().includes('gin')))
  ).slice(0, 5);

  const nonAlcoholic = allProducts.filter(p =>
    (p.category && (p.category.toLowerCase().includes('sem álcool') || p.category.toLowerCase().includes('refrigerante') || p.category.toLowerCase().includes('água'))) ||
    (!p.category && (p.name.toLowerCase().includes('coca') || p.name.toLowerCase().includes('água') || p.name.toLowerCase().includes('guaraná')))
  ).slice(0, 5);

  const highlights = allProducts.slice(0, 10);

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen flex flex-col transition-colors duration-200 font-sans">
      <Header />

      {/* Delivery Options Bar */}
      <div className="bg-surface-light dark:bg-surface-dark py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full inline-flex relative">
            <button className="px-6 py-2 rounded-full bg-primary text-black font-semibold text-sm shadow-sm z-10 transition-transform active:scale-95">
              Receber agora
              <span className="block text-[10px] font-normal opacity-80">15-30 min</span>
            </button>
            <button className="px-6 py-2 rounded-full text-gray-600 dark:text-gray-400 font-medium text-sm hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Agendar
              <span className="block text-[10px] font-normal opacity-70">Com desconto</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-grow pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 mt-6">

          {/* Coupon Banner */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full shrink-0">
              <span className="text-green-700 dark:text-green-300 font-bold text-xl">🏷️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-800 dark:text-green-300">Cupom de frete grátis na 1ª compra!</h3>
              <p className="text-sm text-green-700 dark:text-green-400">Aproveite para pedir suas bebidas favoritas.</p>
            </div>
            <ChevronRight className="text-green-700 dark:text-green-300 w-5 h-5" />
          </div>

          {/* Categories Grid */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Vai de quê hoje?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-floating transition-all h-32 flex flex-col items-center justify-end p-4 cursor-pointer">
                <img alt="Cervejas" className="absolute top-2 w-16 h-16 object-contain group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_JITFTiiGTQ1HBww5q6StFd8Yj72KWswM_cMKfRJjnW8K8S2vAsxAvKViWMaY5I6yFAXttvI3GdpEvbSibeZXnSQH7fv3hQncIBaQP2JsGemomAs7Ofl9P3sWk4maBPOZKFcKjWHf5h9v_DXcxSYrDcMnTJqbltrr-m1vfkTVQNWk5rz-gSfOdRykJzjNFZWGy0claj-Hk6eORUAVt-_G4DoUr5StL6gQQEF4GU-W_rzQ946tCfV6rIc4HfYFf7nmIbBAF-7DSJ1I" />
                <span className="font-semibold text-gray-700 dark:text-gray-200 z-10">Cervejas</span>
              </div>
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-floating transition-all h-32 flex flex-col items-center justify-end p-4 cursor-pointer">
                <img alt="Vinhos" className="absolute top-2 w-16 h-16 object-contain group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9nXrEFIPYTTI8LcUxrVtNOKnvd9GteaKhcmGNQ-SmN0mVuoFzayTYAbZ15y-hHofXiVkEpjhqBTPESeVB4_2OXDprGiPQi2FkLjUZ3sN5XesYvoh1MpOrio3IOtL0szEiaYKAZD_hNRM_qqPqZXuyYqV_Q7kixpqYNijTs-6xgY_cFJjttP9x7xtBIeNLZvt1Mth336nsMvdGkyMfa2jO4HgnECTuWoF-gUJE-WJfoYv342OsG25KV62QDspQhCaYTIPsVTzLBS_F" />
                <span className="font-semibold text-gray-700 dark:text-gray-200 z-10">Vinhos</span>
              </div>
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-floating transition-all h-32 flex flex-col items-center justify-end p-4 cursor-pointer">
                <img alt="Destilados" className="absolute top-2 w-16 h-16 object-contain group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0BQQv-8IMDZwzNDRm15xqgIyn8qrHAYEYDauqTLJkJXFaFB6AvQf4vBkEhJUNz-C96sURbRkTF_ehbng7VgLIGjEDDL8WOCjQF-6GwxCywifzhPZEM4C_uFcAT7Dvenbt6c7FnU4gVTfRm2CT1WICH3N1n3SZeQRZdrMFOisxva1sX3pRT0MOAgFEkP_6ZJSxKJPbEATc0_EZpaTrgguBx-8JzuoGtG5BeSBgy4nyUGn6WyOAnaxVtGHMlmAh4dSRvYrhfebEaN2s" />
                <span className="font-semibold text-gray-700 dark:text-gray-200 z-10">Destilados</span>
              </div>
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-floating transition-all h-32 flex flex-col items-center justify-end p-4 cursor-pointer">
                <img alt="Não Alcoólicos" className="absolute top-2 w-16 h-16 object-contain group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuColwoRCLq32gm_WrugtArYUhfRsh6a9-yPrZkJuQjBb28DjCd4YI3uML-C5JsHqUX0y8u51V2IDxDEpulWyqSGBbdGAqTf8qw8Rk5JVoMmzTmbIG6okfV0hzWCieG1k_bt2rIpToUpO8NmW7AeEO6v56kVMh099APACvFHdWeaRLMTPzbeo2TlY4K4BAk5lYWHNIbJhumfEtlzotyP46jPNhdRgT39AnX40uJTwme-8f1L3zFw4Oj_YG3iX7M8M3YHh4eiGxckDcjJ" />
                <span className="font-semibold text-gray-700 dark:text-gray-200 z-10">Sem Álcool</span>
              </div>
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-floating transition-all h-32 flex flex-col items-center justify-end p-4 cursor-pointer">
                <img alt="Petiscos" className="absolute top-2 w-16 h-16 object-contain group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoDOQqqoGxQNIwl5nbNndV3civTy4DKaDxt7KAts7S0TKADibkP5QJxkgFCtADMPXHWqgkkZled-Vxz8BcXokj1aC4lFbNHEdHadxnFhGEAf7YlRS6FHqQ4j9smhyLlCFNUeY5iSseCsQshVwQo9P6K_CAhCuUJ-bQiJZcuk53V4s9GcS5v3vxnLeaQ15bi9d5wIMeXFVlSJiB0V7MyXmpm4q_Wu16qkAsIomQnkA-trukFsnqncrNW9zu-8dmZ6fcNh6LdV0UfN4t" />
                <span className="font-semibold text-gray-700 dark:text-gray-200 z-10">Petiscos</span>
              </div>
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-floating transition-all h-32 flex flex-col items-center justify-end p-4 cursor-pointer">
                <img alt="Outros" className="absolute top-2 w-16 h-16 object-contain group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0rMU28MOIEHh_QwZTV3UgTZ0WIFfJvzWx4hOEriwqT5rByJN7tH6JF1eV-r8p9aGJI8ZbWFCWnk1xvsRmM2p8wvPFBgKu7hfqJ2EAbqznhYJfKtMEEhVyjCCsA_uYETG7tD7o0vLtdgw3oPNHT-6kyPraStzFeNG60s3Le2OmVxbNDlfmOXzX_hrwKKm7HysKjAX0T--HU3I4IdFDsw6hrLLr6nL8LOKRRv03DhE7O0JMGRQceVaSNImQxhtExBuBIIg3b8txX9wn" />
                <span className="font-semibold text-gray-700 dark:text-gray-200 z-10">Outros</span>
              </div>
            </div>
          </section>

          {/* Featured Products (Horizontal Scroll) */}
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

          {/* Summer Offers (Banners) */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Ofertas de verão</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-100 dark:bg-surface-dark rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow h-48">
                <div className="z-10 relative">
                  <span className="bg-green-700 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">OFERTA</span>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">Salgadinhos<br />com Desconto</h3>
                  <button className="bg-primary text-black p-2 rounded-full mt-2 group-hover:bg-primary-dark transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                <img alt="Salgadinhos" className="h-40 object-contain transform rotate-12 group-hover:scale-110 transition-transform duration-300 absolute -right-2 top-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR_yv2Uxg4h__N8IMFEFw09b1faozBukBD5rzYGWrfK76SZB_sM75ciXut_34QzfacIDEwmdBPIonGr0qn_lefTOBrZaNpAggvNYZYu2vhuIEe8TFIHKg3qE75FqL-poaWJwvAQDwxDYIUu-9sfkpz_KNBDEEQj_YN2bpkDuvNO8UWWnIK4vTArRAqmP09-OBm6ZvVCUhN55o2VkNg2Y0Fgt-7pUjTeT0FLCu7LpnOvEFWnBiDBzsn82joTA0cwicqhqOqnXI7CU9s" />
              </div>
              <div className="bg-gray-100 dark:bg-surface-dark rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow h-48">
                <div className="z-10 relative">
                  <span className="bg-green-700 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">OFERTA</span>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">Cervejas com<br />desconto</h3>
                  <button className="bg-primary text-black p-2 rounded-full mt-2 group-hover:bg-primary-dark transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                <img alt="Cervejas" className="h-40 object-contain transform -rotate-12 group-hover:scale-110 transition-transform duration-300 absolute -right-4 top-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjy6RMrUP1W4NKmN15_6bf5gwfJQhqkbdvfq7n_AQqE26smRHlC9iIXpOz5iAZtB1uanjk68Kadt0HB-omVDQtxpn1kdA4SPYGpIwpvW9DAl5MXc66Q31oVm4mKN9IAhgPt3e5FHTbVrqF-3JQePpPFjlfS0F1DpkoEXX8mcU1GIBisL2PFzuYqOacxJE_J2fmCH3NDC_K15Dq9mnfsPRXDbJYuFQ5_wWYta36YBfGc4FPlVqZOYDRUgfwm5yK677Pe6pZoh2nF2P9" />
              </div>
            </div>
          </section>

          {/* Recommended (Dynamic from Spirits/Beers) */}
          {spirits.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Recomendados pelo Ady</h2>
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
          {beers.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Cervejas Geladas</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {beers.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Carnaval Banner */}
          <section className="rounded-xl overflow-hidden relative h-48 md:h-64 flex items-center bg-gradient-to-r from-red-600 to-red-800">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
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
          </section>

          {/* Brands Grid */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Marcas que amamos</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              <div className="aspect-square bg-red-600 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-black text-xl italic tracking-wider">BRAHMA</span></div>
              <div className="aspect-square bg-blue-900 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-serif font-bold text-xl">Corona</span></div>
              <div className="aspect-square bg-yellow-400 rounded-2xl flex items-center justify-center p-4"><span className="text-red-600 font-black text-2xl tracking-tighter transform -rotate-6">SKOL</span></div>
              <div className="aspect-square bg-green-700 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-bold text-xl">Tanqueray</span></div>
              <div className="aspect-square bg-blue-700 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-bold text-lg tracking-widest">BEATS</span></div>
              <div className="aspect-square bg-yellow-600 rounded-2xl flex items-center justify-center p-4"><span className="text-white font-serif text-center text-xs font-bold">JOHNNIE<br />WALKER</span></div>
            </div>
          </section>

        </div>
      </main>

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

