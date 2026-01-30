import Link from "next/link";

export function CategoriesGrid({ title }: { title?: string }) {
    return (
        <section>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{title || "Vai de quê hoje?"}</h2>
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
    );
}
