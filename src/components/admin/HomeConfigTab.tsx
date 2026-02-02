"use client";

import { useEffect, useState } from "react";
import { Banner, Collection, HomeSection, Product } from "@/types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Image as ImageIcon, Link as LinkIcon, Save, Pencil, X, Check, Grid, Settings, ToggleLeft, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { compressImage } from "@/lib/imageUtils";

interface CategoryItem {
    name: string;
    image_url: string;
    link: string;
    active?: boolean;
}

function generateSlug(text: string) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Separate accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
}

export function HomeConfigTab({ products }: { products: Product[] }) {
    // Fixed Banner State
    const [banner1, setBanner1] = useState<Banner | null>(null);
    const [banner2, setBanner2] = useState<Banner | null>(null);

    // Collections for Banners (implicitly linked by slug)
    const [banner1Collection, setBanner1Collection] = useState<Collection | null>(null);
    const [banner2Collection, setBanner2Collection] = useState<Collection | null>(null);

    // Other Collections
    const [collections, setCollections] = useState<Collection[]>([]);

    const [homeSections, setHomeSections] = useState<HomeSection[]>([]);

    // Collection Form State (for general collections)
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Partial<Collection> | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

    // Section Config State
    const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
    const [sectionConfigForm, setSectionConfigForm] = useState<Record<string, any>>({});

    // Product Selection State
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
    const [productSelectorTarget, setProductSelectorTarget] = useState<'collection' | 'section' | 'banner1' | 'banner2' | null>(null);
    const [tempSelectedProducts, setTempSelectedProducts] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Helper: Get unique categories
    const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    // Helper for uploading category images
    const handleCategoryScanUpload = async (file: File) => {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], "cat.jpg", { type: "image/jpeg" });
        const fileName = `category-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

        const { error } = await supabase.storage.from("products").upload(fileName, compressedFile);
        if (error) throw error;

        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        return data.publicUrl;
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Fetch Banners (we expect 2 specific ones, effectively)
        const { data: bannedData } = await supabase.from('banners').select('*').order('order_index');

        // Find or Init Banner 1
        const b1 = bannedData?.find(b => b.link_url === '/colecao/banner1');
        if (b1) setBanner1(b1);
        else setBanner1({ link_url: '/colecao/banner1', image_url: '', active: true, position: 'main', order_index: 0 } as Banner);

        // Find or Init Banner 2
        const b2 = bannedData?.find(b => b.link_url === '/colecao/banner2');
        if (b2) setBanner2(b2);
        else setBanner2({ link_url: '/colecao/banner2', image_url: '', active: true, position: 'main', order_index: 0 } as Banner);


        // Fetch Collections
        const { data: collData } = await supabase.from('collections').select('*').order('title');

        if (collData) {
            // Separate "System" collections (banner1/banner2) from user collections if needed
            // But user just wants to see general collections in the list.
            // We'll filter out banner1 and banner2 from the main list if we want to hide them, OR we keep them.
            // User said: "nao vamos ter mais espaço para criar banners, e sim editar 2 banners"
            // So implicit collections shouldn't probably clutter the main list? 
            // Let's hide them from the main list for clarity.
            setCollections(collData.filter(c => c.slug !== 'banner1' && c.slug !== 'banner2'));

            // Set specific states
            const c1 = collData.find(c => c.slug === 'banner1');
            if (c1) setBanner1Collection(c1);
            else setBanner1Collection({ title: 'Banner 1 Page', slug: 'banner1', active: true } as Collection);

            const c2 = collData.find(c => c.slug === 'banner2');
            if (c2) setBanner2Collection(c2);
            else setBanner2Collection({ title: 'Banner 2 Page', slug: 'banner2', active: true } as Collection);
        }

        const { data: sectData } = await supabase.from('home_sections').select('*').order('order_index');
        if (sectData) setHomeSections(sectData);
    };

    // --- Specific Banners Handlers ---
    const handleSaveFixedBanner = async (slot: 1 | 2) => {
        const bannerState = slot === 1 ? banner1 : banner2;
        const colState = slot === 1 ? banner1Collection : banner2Collection;

        if (!bannerState?.image_url) return alert("Imagem do banner obrigatória");

        try {
            // 1. Upsert Collection
            let collectionId = colState?.id;
            const collectionData = {
                title: colState?.title || (slot === 1 ? 'Página Banner 1' : 'Página Banner 2'),
                slug: slot === 1 ? 'banner1' : 'banner2',
                active: true,
                description: colState?.description || ''
            };

            if (collectionId) {
                await supabase.from('collections').update(collectionData).eq('id', collectionId);
            } else {
                const { data, error } = await supabase.from('collections').insert(collectionData).select();
                if (error || !data) throw error;
                collectionId = data[0].id; // update local variable
            }

            // 2. Upsert Banner
            // We use link_url as the unique identifier logic if ID doesn't exist
            const bannerData = {
                image_url: bannerState.image_url,
                link_url: `/colecao/${slot === 1 ? 'banner1' : 'banner2'}`,
                active: true,
                position: 'main',
                title: bannerState?.title || (slot === 1 ? 'Banner 1' : 'Banner 2'),
                order_index: slot // Ensure order
            };

            if (bannerState?.id) {
                await supabase.from('banners').update(bannerData).eq('id', bannerState.id);
            } else {
                await supabase.from('banners').insert(bannerData);
            }

            fetchData();
            alert(`Banner ${slot} salvo com sucesso!`);

        } catch (error: any) {
            console.error("Erro ao salvar banner:", error);
            alert("Erro ao salvar: " + error.message);
        }
    };

    const handleOpenProductSelectorForBanner = async (slot: 1 | 2) => {
        const colState = slot === 1 ? banner1Collection : banner2Collection;

        // If collection exists, fetch items
        if (colState?.id) {
            const { data } = await supabase.from('collection_items').select('product_id').eq('collection_id', colState.id);
            const ids = data ? data.map(d => d.product_id) : [];
            setTempSelectedProducts(ids);
        } else {
            setTempSelectedProducts([]);
        }

        setProductSelectorTarget(slot === 1 ? 'banner1' : 'banner2');
        setIsProductSelectorOpen(true);
        setSearchTerm("");
        setCategoryFilter("all");
    };

    const handleDeleteCollection = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta coleção? Isso não pode ser desfeito.")) return;

        // 1. Delete items inside collection
        await supabase.from('collection_items').delete().eq('collection_id', id);

        // 2. Delete collection itself
        const { error } = await supabase.from('collections').delete().eq('id', id);

        if (error) {
            console.error("Erro ao excluir coleção:", error);
            alert("Erro ao excluir coleção: " + error.message);
        } else {
            fetchData();
        }
    };

    // --- Collections ---
    const handleOpenCollectionModal = (collection?: Collection) => {
        if (collection) {
            setEditingCollection(collection);
            // Fetch items
            supabase.from('collection_items').select('product_id').eq('collection_id', collection.id)
                .then(({ data }) => {
                    if (data) setSelectedProducts(data.map(d => d.product_id));
                });
        } else {
            setEditingCollection({ active: true, featured: false });
            setSelectedProducts([]);
        }
        setIsCollectionModalOpen(true);
    };

    // Refactored to open generic product selector
    const openProductSelectorForCollection = () => {
        setTempSelectedProducts([...selectedProducts]);
        setProductSelectorTarget('collection');
        setIsProductSelectorOpen(true);
        setSearchTerm("");
        setCategoryFilter("all");
    };

    const openProductSelectorForSection = () => {
        const currentIds = sectionConfigForm.product_ids || [];
        setTempSelectedProducts([...currentIds]);
        setProductSelectorTarget('section');
        setIsProductSelectorOpen(true);
        setSearchTerm("");
        setCategoryFilter("all");
    };

    const handleSaveProductSelection = async () => {
        if (productSelectorTarget === 'collection') {
            setSelectedProducts(tempSelectedProducts);
            setIsProductSelectorOpen(false);
        }
        else if (productSelectorTarget === 'section') {
            setSectionConfigForm({ ...sectionConfigForm, product_ids: tempSelectedProducts });
            setIsProductSelectorOpen(false);
        }
        else if (productSelectorTarget === 'banner1' || productSelectorTarget === 'banner2') {
            const slot = productSelectorTarget === 'banner1' ? 1 : 2;
            const colState = slot === 1 ? banner1Collection : banner2Collection;

            // If collection doesn't exist yet, we can't save items to it directly via this modal logic 
            // without first creating the collection.
            // Simplification: Require the user to click "Salvar Alterações" on the banner card to fully persist everything.
            // BUT, for the product selector to work intuitively, we probably want to persist selection immediately or locally.
            // Let's persist immediately if collection exists, otherwise just alert user to save banner first.

            if (!colState?.id) {
                // Warning: Collection doesn't exist. We will just save locally if possible? 
                // Wait, if I create the collection on "Save Banner", then I can't save items now.
                // Better approach: When opening modal, if collection ID is null, we create it? 
                // Or: We store selection in a local state for banner1/banner2 and save it when "Save Banner" is clicked?
                // Given the current architecture, let's just create the collection on the fly if it doesn't exist when they try to save items? 

                // Better: Just save directly to DB here if ID exists.
                // If not, we have to create it.

                let cid = colState?.id;
                if (!cid) {
                    const collectionData = {
                        title: slot === 1 ? 'Página Banner 1' : 'Página Banner 2',
                        slug: slot === 1 ? 'banner1' : 'banner2',
                        active: true
                    };
                    const { data } = await supabase.from('collections').insert(collectionData).select();
                    if (data) cid = data[0].id;
                }

                if (cid) {
                    await supabase.from('collection_items').delete().eq('collection_id', cid);
                    if (tempSelectedProducts.length > 0) {
                        const items = tempSelectedProducts.map(pid => ({ collection_id: cid, product_id: pid }));
                        await supabase.from('collection_items').insert(items);
                    }
                    alert("Produtos vinculados com sucesso!");
                    fetchData(); // Refresh to get IDs etc
                }

            } else {
                // Update items directly
                await supabase.from('collection_items').delete().eq('collection_id', colState.id);
                if (tempSelectedProducts.length > 0) {
                    const items = tempSelectedProducts.map(pid => ({ collection_id: colState.id, product_id: pid }));
                    await supabase.from('collection_items').insert(items);
                }
                alert("Produtos vinculados com sucesso!");
            }
            setIsProductSelectorOpen(false);
        }
    };

    const toggleTempProductSelection = (pid: number) => {
        setTempSelectedProducts(prev =>
            prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
        );
    };

    const handleSaveCollection = async () => {
        if (!editingCollection?.title || !editingCollection?.slug) return alert("Título e Slug obrigatórios");

        let collectionId = editingCollection.id;

        const collectionData = {
            title: editingCollection.title,
            slug: editingCollection.slug,
            description: editingCollection.description,
            image_url: editingCollection.image_url,
            active: editingCollection.active,
            featured: editingCollection.featured
        };

        try {
            if (collectionId) {
                // Update - Ensure no ID or created_at is sent if they accidentally got into collectionData (though above object creation prevents it, it's good practice)
                const { error } = await supabase.from('collections').update(collectionData).eq('id', collectionId);
                if (error) throw error;
            } else {
                // Insert
                const { data, error } = await supabase.from('collections').insert(collectionData).select();
                if (error || !data) throw error || new Error("Erro ao criar coleção");
                collectionId = data[0].id; // Get the new ID
            }

            // Update Items
            // 1. Delete all existing items for this collection
            // Note: If this is a new collection, this delete is harmless but redundant.
            // Keeping it simple: delete all, then re-insert.
            if (collectionId) {
                const { error: deleteError } = await supabase.from('collection_items').delete().eq('collection_id', collectionId);
                if (deleteError) throw deleteError;

                // 2. Insert new items if any selected
                if (selectedProducts.length > 0) {
                    const itemsToInsert = selectedProducts.map(pid => ({
                        collection_id: collectionId,
                        product_id: pid
                    }));
                    const { error: insertError } = await supabase.from('collection_items').insert(itemsToInsert);
                    if (insertError) throw insertError;
                }
            }

            setIsCollectionModalOpen(false);
            fetchData();
            alert("Coleção salva com sucesso!");

        } catch (error: any) {
            console.error("Erro ao salvar coleção:", error);
            alert("Erro ao salvar coleção: " + (error.message || error.toString()));
        }
    };



    const toggleProductSelection = (pid: number) => {
        setSelectedProducts(prev =>
            prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
        );
    };

    // --- Sections Config ---
    const handleToggleSection = async (section: HomeSection) => {
        const newActive = !section.active;
        const { error } = await supabase.from('home_sections').update({ active: newActive }).eq('slug', section.slug);

        if (error) alert("Erro ao atualizar seção");
        else fetchData();
    };

    const handleOpenSectionConfig = (section: HomeSection) => {
        setEditingSection(section);
        let config = section.config || {};

        // Pre-fill default categories if empty
        if (section.slug === 'categories' && (!config.categories || config.categories.length === 0)) {
            config = {
                ...config,
                title: config.title || "Vai de quê hoje?",
                categories: [
                    { name: "Cervejas", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_JITFTiiGTQ1HBww5q6StFd8Yj72KWswM_cMKfRJjnW8K8S2vAsxAvKViWMaY5I6yFAXttvI3GdpEvbSibeZXnSQH7fv3hQncIBaQP2JsGemomAs7Ofl9P3sWk4maBPOZKFcKjWHf5h9v_DXcxSYrDcMnTJqbltrr-m1vfkTVQNWk5rz-gSfOdRykJzjNFZWGy0claj-Hk6eORUAVt-_G4DoUr5StL6gQQEF4GU-W_rzQ946tCfV6rIc4HfYFf7nmIbBAF-7DSJ1I", link: "/categoria/cervejas", active: true },
                    { name: "Vinhos", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9nXrEFIPYTTI8LcUxrVtNOKnvd9GteaKhcmGNQ-SmN0mVuoFzayTYAbZ15y-hHofXiVkEpjhqBTPESeVB4_2OXDprGiPQi2FkLjUZ3sN5XesYvoh1MpOrio3IOtL0szEiaYKAZD_hNRM_qqPqZXuyYqV_Q7kixpqYNijTs-6xgY_cFJjttP9x7xtBIeNLZvt1Mth336nsMvdGkyMfa2jO4HgnECTuWoF-gUJE-WJfoYv342OsG25KV62QDspQhCaYTIPsVTzLBS_F", link: "/categoria/vinhos", active: true },
                    { name: "Destilados", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0BQQv-8IMDZwzNDRm15xqgIyn8qrHAYEYDauqTLJkJXFaFB6AvQf4vBkEhJUNz-C96sURbRkTF_ehbng7VgLIGjEDDL8WOCjQF-6GwxCywifzhPZEM4C_uFcAT7Dvenbt6c7FnU4gVTfRm2CT1WICH3N1n3SZeQRZdrMFOisxva1sX3pRT0MOAgFEkP_6ZJSxKJPbEATc0_EZpaTrgguBx-8JzuoGtG5BeSBgy4nyUGn6WyOAnaxVtGHMlmAh4dSRvYrhfebEaN2s", link: "/categoria/destilados", active: true },
                    { name: "Sem Álcool", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuColwoRCLq32gm_WrugtArYUhfRsh6a9-yPrZkJuQjBb28DjCd4YI3uML-C5JsHqUX0y8u51V2IDxDEpulWyqSGBbdGAqTf8qw8Rk5JVoMmzTmbIG6okfV0hzWCieG1k_bt2rIpToUpO8NmW7AeEO6v56kVMh099APACvFHdWeaRLMTPzbeo2TlY4K4BAk5lYWHNIbJhumfEtlzotyP46jPNhdRgT39AnX40uJTwme-8f1L3zFw4Oj_YG3iX7M8M3YHh4eiGxckDcjJ", link: "/categoria/sem-alcool", active: true },
                    { name: "Petiscos", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoDOQqqoGxQNIwl5nbNndV3civTy4DKaDxt7KAts7S0TKADibkP5QJxkgFCtADMPXHWqgkkZled-Vxz8BcXokj1aC4lFbNHEdHadxnFhGEAf7YlRS6FHqQ4j9smhyLlCFNUeY5iSseCsQshVwQo9P6K_CAhCuUJ-bQiJZcuk53V4s9GcS5v3vxnLeaQ15bi9d5wIMeXFVlSJiB0V7MyXmpm4q_Wu16qkAsIomQnkA-trukFsnqncrNW9zu-8dmZ6fcNh6LdV0UfN4t", link: "/categoria/petiscos", active: true },
                    { name: "Outros", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0rMU28MOIEHh_QwZTV3UgTZ0WIFfJvzWx4hOEriwqT5rByJN7tH6JF1eV-r8p9aGJI8ZbWFCWnk1xvsRmM2p8wvPFBgKu7hfqJ2EAbqznhYJfKtMEEhVyjCCsA_uYETG7tD7o0vLtdgw3oPNHT-6kyPraStzFeNG60s3Le2OmVxbNDlfmOXzX_hrwKKm7HysKjAX0T--HU3I4IdFDsw6hrLLr6nL8LOKRRv03DhE7O0JMGRQceVaSNImQxhtExBuBIIg3b8txX9wn", link: "/categoria/outros", active: true }
                ]
            };
        }

        setSectionConfigForm(config);
    };

    const handleSaveSectionConfig = async () => {
        if (!editingSection) return;

        const { error } = await supabase.from('home_sections').update({ config: sectionConfigForm }).eq('slug', editingSection.slug);

        if (error) alert("Erro ao salvar configuração");
        else {
            setEditingSection(null);
            fetchData();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Banners & Pages Section */}
            <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ImageIcon className="text-primary" /> Banners da Home (Destaques)
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Banner 1 */}
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <Input
                                value={banner1Collection?.title || 'Banner Destaque 1'}
                                onChange={e => setBanner1Collection(prev => ({ ...prev!, title: e.target.value }))}
                                className="mb-2 font-bold bg-transparent border-transparent hover:border-neutral-800 text-lg p-0 h-auto focus-visible:ring-0 focus:border-neutral-700 transition-all"
                                placeholder="Título da Página"
                            />
                            <Label className="text-xs text-neutral-500 mb-1 block">Título do Banner (Alt Text)</Label>
                            <Input
                                value={banner1?.title || 'Banner 1'}
                                onChange={e => setBanner1(prev => ({ ...prev!, title: e.target.value }))}
                                className="mb-0 bg-transparent border-transparent hover:border-neutral-800 text-sm p-0 h-auto focus-visible:ring-0 focus:border-neutral-700 transition-all text-neutral-400"
                                placeholder="Título interno do banner"
                            />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Imagem do Banner</Label>
                                <div className="mt-2 mb-6">
                                    <ImageUpload
                                        value={banner1?.image_url || ''}
                                        className="w-full mb-2"
                                        onChange={async (fileOrUrl) => {
                                            if (fileOrUrl instanceof File) {
                                                try {
                                                    const url = await handleCategoryScanUpload(fileOrUrl);
                                                    setBanner1(prev => ({ ...prev!, image_url: url }));
                                                } catch (e) { alert("Erro no upload"); }
                                            } else {
                                                setBanner1(prev => ({ ...prev!, image_url: fileOrUrl as string }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                                <Label className="text-xs text-neutral-400 mb-2 block">Página de Destino: /colecao/banner1</Label>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <span className="text-sm font-bold">Produtos da Página</span>
                                    <Button size="sm" variant="secondary" onClick={() => handleOpenProductSelectorForBanner(1)} className="w-full sm:w-auto">
                                        <Grid size={14} className="mr-2" />
                                        Selecionar Produtos
                                    </Button>
                                </div>
                            </div>

                            <Button onClick={() => handleSaveFixedBanner(1)} className="w-full font-bold bg-primary text-black hover:bg-yellow-500">
                                <Save size={16} className="mr-2" /> Salvar Banner 1
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Banner 2 */}
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <Input
                                value={banner2Collection?.title || 'Banner Destaque 2'}
                                onChange={e => setBanner2Collection(prev => ({ ...prev!, title: e.target.value }))}
                                className="mb-2 font-bold bg-transparent border-transparent hover:border-neutral-800 text-lg p-0 h-auto focus-visible:ring-0 focus:border-neutral-700 transition-all"
                                placeholder="Título da Página"
                            />
                            <Label className="text-xs text-neutral-500 mb-1 block">Título do Banner (Alt Text)</Label>
                            <Input
                                value={banner2?.title || 'Banner 2'}
                                onChange={e => setBanner2(prev => ({ ...prev!, title: e.target.value }))}
                                className="mb-0 bg-transparent border-transparent hover:border-neutral-800 text-sm p-0 h-auto focus-visible:ring-0 focus:border-neutral-700 transition-all text-neutral-400"
                                placeholder="Título interno do banner"
                            />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Imagem do Banner</Label>
                                <div className="mt-2 mb-6">
                                    <ImageUpload
                                        value={banner2?.image_url || ''}
                                        className="w-full mb-2"
                                        onChange={async (fileOrUrl) => {
                                            if (fileOrUrl instanceof File) {
                                                try {
                                                    const url = await handleCategoryScanUpload(fileOrUrl);
                                                    setBanner2(prev => ({ ...prev!, image_url: url }));
                                                } catch (e) { alert("Erro no upload"); }
                                            } else {
                                                setBanner2(prev => ({ ...prev!, image_url: fileOrUrl as string }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                                <Label className="text-xs text-neutral-400 mb-2 block">Página de Destino: /colecao/banner2</Label>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <span className="text-sm font-bold">Produtos da Página</span>
                                    <Button size="sm" variant="secondary" onClick={() => handleOpenProductSelectorForBanner(2)} className="w-full sm:w-auto">
                                        <Grid size={14} className="mr-2" />
                                        Selecionar Produtos
                                    </Button>
                                </div>
                            </div>

                            <Button onClick={() => handleSaveFixedBanner(2)} className="w-full font-bold bg-primary text-black hover:bg-yellow-500">
                                <Save size={16} className="mr-2" /> Salvar Banner 2
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Collections Section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Grid className="text-primary" /> Coleções & Promoções
                    </h2>
                    <Button onClick={() => handleOpenCollectionModal()} size="sm" variant="outline">
                        <Plus size={16} className="mr-2" /> Nova Coleção
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {collections.map(col => (
                        <Card key={col.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">{col.title}</h3>
                                    {col.featured && <span className="text-[10px] bg-primary text-black px-1.5 py-0.5 rounded font-bold">HOME</span>}
                                </div>
                                <p className="text-xs text-neutral-500 mb-4 font-mono">/{col.slug}</p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleOpenCollectionModal(col)}>
                                        Editar / Produtos
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeleteCollection(col.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Fixed Sections Config */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="text-primary" /> Seções Fixas do Layout
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {homeSections.map(section => (
                        <Card key={section.slug} className={`border border-neutral-800 transition-colors ${section.active ? 'bg-neutral-900' : 'bg-neutral-950 opacity-60'}`}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold">{section.name}</h3>
                                        <p className="text-xs text-neutral-500 font-mono">{section.slug}</p>
                                    </div>
                                    <Switch
                                        checked={section.active}
                                        onCheckedChange={() => handleToggleSection(section)}
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs"
                                    onClick={() => handleOpenSectionConfig(section)}
                                    disabled={!section.active}
                                >
                                    Configurar
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Section Config Modal */}
            <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
                <DialogContent className="bg-neutral-950 border-neutral-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Configurar: {editingSection?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {editingSection && Object.keys(editingSection.config).length === 0 && (
                            <p className="text-sm text-neutral-500 italic">Esta seção não possui configurações de texto ou imagem.</p>
                        )}

                        {editingSection && editingSection.slug === 'categories' ? (
                            <div className="space-y-4">
                                <Label className="text-yellow-500">Categorias da Grade</Label>
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {(sectionConfigForm.categories || []).map((cat: CategoryItem, index: number) => (
                                        <div key={index} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 space-y-3 relative">
                                            <div className="absolute right-2 top-2 flex items-center gap-2">
                                                <Switch
                                                    checked={cat.active !== false}
                                                    onCheckedChange={(checked) => {
                                                        const newCats = [...(sectionConfigForm.categories || [])];
                                                        newCats[index].active = checked;
                                                        setSectionConfigForm({ ...sectionConfigForm, categories: newCats });
                                                    }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-6 h-6 text-red-500 hover:bg-red-900/20"
                                                    onClick={() => {
                                                        const newCats = [...(sectionConfigForm.categories || [])];
                                                        newCats.splice(index, 1);
                                                        setSectionConfigForm({ ...sectionConfigForm, categories: newCats });
                                                    }}
                                                >
                                                    <X size={14} />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-[80px_1fr] gap-4">
                                                <div className="w-20">
                                                    <ImageUpload
                                                        value={cat.image_url}
                                                        className="w-20 h-20"
                                                        placeholder="Img"
                                                        onChange={async (fileOrUrl) => {
                                                            const newCats = [...(sectionConfigForm.categories || [])];
                                                            if (fileOrUrl instanceof File) {
                                                                // Should ideally show loading state here
                                                                try {
                                                                    const url = await handleCategoryScanUpload(fileOrUrl);
                                                                    newCats[index].image_url = url;
                                                                    setSectionConfigForm({ ...sectionConfigForm, categories: newCats });
                                                                } catch (e) { alert("Erro upload"); }
                                                            } else {
                                                                newCats[index].image_url = fileOrUrl as string || "";
                                                                setSectionConfigForm({ ...sectionConfigForm, categories: newCats });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <Label className="text-xs text-neutral-500">Nome</Label>
                                                        <Input
                                                            value={cat.name}
                                                            onChange={e => {
                                                                const newCats = [...(sectionConfigForm.categories || [])];
                                                                newCats[index].name = e.target.value;
                                                                setSectionConfigForm({ ...sectionConfigForm, categories: newCats });
                                                            }}
                                                            className="h-8 bg-neutral-950 border-neutral-700"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-neutral-500">Link (/category/...)</Label>
                                                        <Input
                                                            value={cat.link}
                                                            onChange={e => {
                                                                const newCats = [...(sectionConfigForm.categories || [])];
                                                                newCats[index].link = e.target.value;
                                                                setSectionConfigForm({ ...sectionConfigForm, categories: newCats });
                                                            }}
                                                            className="h-8 bg-neutral-950 border-neutral-700 font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full border-dashed border-neutral-700 hover:bg-neutral-900"
                                    onClick={() => {
                                        const newCats = [...(sectionConfigForm.categories || []), { name: "Nova", image_url: "", link: "/categoria/nova", active: true }];
                                        setSectionConfigForm({ ...sectionConfigForm, categories: newCats });
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Adicionar Categoria
                                </Button>
                            </div>
                        ) : (
                            editingSection && Object.entries(editingSection.config).map(([key, value]) => {
                                if (key === 'product_ids' || key === 'categories') return null; // Don't show complex fields in generic loop
                                return (
                                    <div key={key}>
                                        <Label className="capitalize">{key.replace('_', ' ')}</Label>
                                        {key === 'keywords' ? (
                                            <Input
                                                value={Array.isArray(value) ? value.join(', ') : value}
                                                onChange={e => setSectionConfigForm({ ...sectionConfigForm, [key]: e.target.value.split(',').map(s => s.trim()) })}
                                                className="bg-neutral-900 border-neutral-800"
                                            />
                                        ) : (
                                            <Input
                                                value={sectionConfigForm[key] || ''}
                                                onChange={e => setSectionConfigForm({ ...sectionConfigForm, [key]: e.target.value })}
                                                className="bg-neutral-900 border-neutral-800"
                                            />
                                        )}
                                        {key === 'keywords' && <p className="text-[10px] text-neutral-500">Separar por vírgula</p>}
                                    </div>
                                )
                            })
                        )}

                        {/* Manual Product Selection Button for relevant sections */}
                        {editingSection && ['recommended', 'beers'].includes(editingSection.slug) && (
                            <div className="pt-2 border-t border-neutral-800">
                                <Label className="block mb-2 text-yellow-500">Seleção Manual de Produtos</Label>
                                <Button variant="secondary" onClick={openProductSelectorForSection} className="w-full justify-between">
                                    <span>{sectionConfigForm.product_ids?.length || 0} produtos selecionados</span>
                                    <Pencil size={14} />
                                </Button>
                                <p className="text-[10px] text-neutral-500 mt-1">
                                    Se houver produtos selecionados, eles terão prioridade sobre as palavras-chave.
                                </p>
                            </div>
                        )}

                        <Button onClick={handleSaveSectionConfig} className="w-full font-bold bg-primary text-black hover:bg-yellow-500 mt-4">
                            Salvar Configuração
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Generic Product Selector Modal */}
            <Dialog open={isProductSelectorOpen} onOpenChange={setIsProductSelectorOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-neutral-950 border-neutral-800 text-white p-0">
                    <div className="p-6 border-b border-neutral-800">
                        <DialogHeader>
                            <DialogTitle>Selecionar Produtos</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-4 mt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-neutral-500 w-4 h-4" />
                                <Input
                                    placeholder="Buscar produto..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-neutral-900 border-neutral-800"
                                />
                            </div>
                            <select
                                className="bg-neutral-900 border border-neutral-800 rounded-md px-3 text-sm min-w-[150px]"
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                            >
                                {categories.map(c => (
                                    <option key={c} value={c}>{c === 'all' ? 'Todas as Categorias' : c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => toggleTempProductSelection(p.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${tempSelectedProducts.includes(p.id)
                                        ? "bg-primary/20 border-primary"
                                        : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${tempSelectedProducts.includes(p.id) ? "bg-primary border-primary" : "border-neutral-600"
                                        }`}>
                                        {tempSelectedProducts.includes(p.id) && <Check size={14} className="text-black" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate text-white">{p.name}</p>
                                        <p className="text-xs text-neutral-400 truncate">{p.category || 'Sem categoria'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t border-neutral-800 bg-neutral-900 flex justify-between items-center">
                        <span className="text-sm text-neutral-400">
                            {tempSelectedProducts.length} produtos selecionados
                        </span>
                        <Button onClick={handleSaveProductSelection} className="bg-primary text-black font-bold hover:bg-yellow-500">
                            Confirmar Seleção
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Collection Edit Modal (Simplified) */}
            <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
                <DialogContent className="max-w-xl bg-neutral-950 border-neutral-800 text-white">
                    <DialogHeader>
                        <DialogTitle>{editingCollection?.id ? 'Editar Coleção' : 'Nova Coleção'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <Label>Título</Label>
                            <Input
                                value={editingCollection?.title || ''}
                                onChange={e => {
                                    const title = e.target.value;
                                    setEditingCollection(prev => {
                                        // Auto-generate slug if creating new collection and slug is empty or matches auto-generated from previous title
                                        // For simplicity, just auto-gen if it's a new collection or if the user hasn't typed a custom slug yet (we can't easily track that without more state, so we'll just auto-gen if it's new)
                                        const newState = { ...prev, title };
                                        if (!prev?.id) {
                                            newState.slug = generateSlug(title);
                                        }
                                        return newState;
                                    });
                                }}
                                className="bg-neutral-900 border-neutral-800"
                            />
                        </div>
                        <div>
                            <Label>Slug (URL)</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={editingCollection?.slug || ''}
                                    onChange={e => setEditingCollection(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                                    placeholder="ex: verao-2024"
                                    className="bg-neutral-900 border-neutral-800 font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    title="Gerar Slug do Título"
                                    onClick={() => setEditingCollection(prev => ({ ...prev, slug: generateSlug(prev?.title || '') }))}
                                >
                                    <LinkIcon size={16} />
                                </Button>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-1">Usado na URL: distribuidora.com/colecao/<b>{editingCollection?.slug || '...'}</b></p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={editingCollection?.active}
                                    onCheckedChange={c => setEditingCollection(prev => ({ ...prev, active: c }))}
                                />
                                <Label>Ativa</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={editingCollection?.featured}
                                    onCheckedChange={c => setEditingCollection(prev => ({ ...prev, featured: c }))}
                                />
                                <Label className="text-yellow-400">Destaque na Home</Label>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Label className="block mb-2">Produtos</Label>
                            <Button variant="outline" onClick={openProductSelectorForCollection} className="w-full justify-between">
                                <span>{selectedProducts.length} produtos selecionados</span>
                                <Pencil size={14} />
                            </Button>
                        </div>

                        <Button onClick={handleSaveCollection} className="mt-4 w-full font-bold bg-primary text-black hover:bg-yellow-500">
                            <Save className="mr-2 w-4 h-4" /> Salvar Coleção
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

