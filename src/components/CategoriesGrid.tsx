import Link from "next/link";

interface CategoryItem {
    name: string;
    image_url: string;
    link: string;
    active?: boolean;
}

interface CategoriesGridProps {
    title?: string;
    categories?: CategoryItem[];
}

export function CategoriesGrid({ title, categories }: CategoriesGridProps) {
    // Default categories if none configured
    const defaultCategories: CategoryItem[] = [
        { name: "Cervejas", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_JITFTiiGTQ1HBww5q6StFd8Yj72KWswM_cMKfRJjnW8K8S2vAsxAvKViWMaY5I6yFAXttvI3GdpEvbSibeZXnSQH7fv3hQncIBaQP2JsGemomAs7Ofl9P3sWk4maBPOZKFcKjWHf5h9v_DXcxSYrDcMnTJqbltrr-m1vfkTVQNWk5rz-gSfOdRykJzjNFZWGy0claj-Hk6eORUAVt-_G4DoUr5StL6gQQEF4GU-W_rzQ946tCfV6rIc4HfYFf7nmIbBAF-7DSJ1I", link: "/categoria/cervejas", active: true },
        { name: "Vinhos", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9nXrEFIPYTTI8LcUxrVtNOKnvd9GteaKhcmGNQ-SmN0mVuoFzayTYAbZ15y-hHofXiVkEpjhqBTPESeVB4_2OXDprGiPQi2FkLjUZ3sN5XesYvoh1MpOrio3IOtL0szEiaYKAZD_hNRM_qqPqZXuyYqV_Q7kixpqYNijTs-6xgY_cFJjttP9x7xtBIeNLZvt1Mth336nsMvdGkyMfa2jO4HgnECTuWoF-gUJE-WJfoYv342OsG25KV62QDspQhCaYTIPsVTzLBS_F", link: "/categoria/vinhos", active: true },
        { name: "Destilados", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0BQQv-8IMDZwzNDRm15xqgIyn8qrHAYEYDauqTLJkJXFaFB6AvQf4vBkEhJUNz-C96sURbRkTF_ehbng7VgLIGjEDDL8WOCjQF-6GwxCywifzhPZEM4C_uFcAT7Dvenbt6c7FnU4gVTfRm2CT1WICH3N1n3SZeQRZdrMFOisxva1sX3pRT0MOAgFEkP_6ZJSxKJPbEATc0_EZpaTrgguBx-8JzuoGtG5BeSBgy4nyUGn6WyOAnaxVtGHMlmAh4dSRvYrhfebEaN2s", link: "/categoria/destilados", active: true },
        { name: "Sem Álcool", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuColwoRCLq32gm_WrugtArYUhfRsh6a9-yPrZkJuQjBb28DjCd4YI3uML-C5JsHqUX0y8u51V2IDxDEpulWyqSGBbdGAqTf8qw8Rk5JVoMmzTmbIG6okfV0hzWCieG1k_bt2rIpToUpO8NmW7AeEO6v56kVMh099APACvFHdWeaRLMTPzbeo2TlY4K4BAk5lYWHNIbJhumfEtlzotyP46jPNhdRgT39AnX40uJTwme-8f1L3zFw4Oj_YG3iX7M8M3YHh4eiGxckDcjJ", link: "/categoria/sem-alcool", active: true },
        { name: "Petiscos", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoDOQqqoGxQNIwl5nbNndV3civTy4DKaDxt7KAts7S0TKADibkP5QJxkgFCtADMPXHWqgkkZled-Vxz8BcXokj1aC4lFbNHEdHadxnFhGEAf7YlRS6FHqQ4j9smhyLlCFNUeY5iSseCsQshVwQo9P6K_CAhCuUJ-bQiJZcuk53V4s9GcS5v3vxnLeaQ15bi9d5wIMeXFVlSJiB0V7MyXmpm4q_Wu16qkAsIomQnkA-trukFsnqncrNW9zu-8dmZ6fcNh6LdV0UfN4t", link: "/categoria/petiscos", active: true },
        { name: "Outros", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0rMU28MOIEHh_QwZTV3UgTZ0WIFfJvzWx4hOEriwqT5rByJN7tH6JF1eV-r8p9aGJI8ZbWFCWnk1xvsRmM2p8wvPFBgKu7hfqJ2EAbqznhYJfKtMEEhVyjCCsA_uYETG7tD7o0vLtdgw3oPNHT-6kyPraStzFeNG60s3Le2OmVxbNDlfmOXzX_hrwKKm7HysKjAX0T--HU3I4IdFDsw6hrLLr6nL8LOKRRv03DhE7O0JMGRQceVaSNImQxhtExBuBIIg3b8txX9wn", link: "/categoria/outros", active: true }
    ];

    const displayCategories = (categories && categories.length > 0 ? categories : defaultCategories).filter(c => c.active !== false);

    // Split into Primary and Secondary
    const primaryKeywords = ['cerveja', 'destilado'];

    // Helper to check if a category is primary
    const isPrimary = (cat: CategoryItem) => {
        const nameLower = cat.name.toLowerCase();
        return primaryKeywords.some(key => nameLower.includes(key));
    };

    const primaryCategories = displayCategories.filter(isPrimary);
    const secondaryCategories = displayCategories.filter(c => !isPrimary(c));

    // Fallback: If no primary found via keywords, take first 2
    const finalPrimary = primaryCategories.length > 0 ? primaryCategories : displayCategories.slice(0, 2);
    const finalSecondary = primaryCategories.length > 0 ? secondaryCategories : displayCategories.slice(2);

    return (
        <section>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{title || "Vai de quê hoje?"}</h2>

            {/* Primary Categories (Big Grid) */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {finalPrimary.map((cat, idx) => (
                    <Link
                        key={idx}
                        href={cat.link || '#'}
                        className="block w-full group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-floating transition-all h-40 flex flex-col items-center justify-end p-4 cursor-pointer"
                    >
                        {cat.image_url && (
                            <img
                                alt={cat.name}
                                className="absolute top-2 w-24 h-24 object-contain group-hover:scale-110 transition-transform"
                                src={cat.image_url}
                            />
                        )}
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-100 z-10">{cat.name}</span>
                    </Link>
                ))}
            </div>

            {/* Secondary Categories (Carousel) */}
            {finalSecondary.length > 0 && (
                <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                    <div className="flex gap-4 w-max">
                        {finalSecondary.map((cat, idx) => (
                            <Link
                                key={idx}
                                href={cat.link || '#'}
                                className="min-w-[100px] w-[100px] group relative overflow-hidden rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-floating transition-all h-28 flex flex-col items-center justify-center p-2 cursor-pointer"
                            >
                                {cat.image_url && (
                                    <img
                                        alt={cat.name}
                                        className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition-transform"
                                        src={cat.image_url}
                                    />
                                )}
                                <span className="font-medium text-xs text-center text-gray-700 dark:text-gray-200 z-10 leading-tight">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
