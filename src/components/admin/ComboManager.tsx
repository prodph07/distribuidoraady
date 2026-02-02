"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search, Save, Package, ArrowRight, AlertTriangle, Filter, Pencil, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { compressImage } from "@/lib/imageUtils";

interface ComboItem {
    id?: number;
    parent_product_id: number;
    child_product_id: number;
    quantity: number;
    product?: Product; // joined
}

interface ComboManagerProps {
    products: Product[];
    onRefresh: () => void;
}

export function ComboManager({ products, onRefresh }: ComboManagerProps) {
    const [selectedComboId, setSelectedComboId] = useState<number | null>(null);
    const [comboItems, setComboItems] = useState<ComboItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [potentialSearchTerm, setPotentialSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Create/Edit Combo State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [newComboData, setNewComboData] = useState({
        name: "",
        price: 0,
        description: "",
        category: "Kits",
        image_url: ""
    });

    // Derived state
    const combos = products
        .filter(p => p.is_combo)
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const potentialCombos = products.filter(p => !p.is_combo); // Products that can become combos
    const availableItems = products.filter(p => !p.is_combo && p.id !== selectedComboId); // Items that can be added (protect against cycles lightly)

    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

    const filteredPotentialCombos = potentialCombos.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(potentialSearchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const selectedCombo = products.find(p => p.id === selectedComboId);

    useEffect(() => {
        if (selectedComboId) {
            fetchComboItems(selectedComboId);
        } else {
            setComboItems([]);
        }
    }, [selectedComboId]);

    const fetchComboItems = async (parentId: number) => {
        setLoadingItems(true);
        const { data, error } = await supabase
            .from('combo_items')
            .select(`
                *,
                product:products!child_product_id(*)
            `)
            .eq('parent_product_id', parentId);

        if (error) {
            console.error("Error fetching combo items", error);
        } else {
            setComboItems(data as any || []);
        }
        setLoadingItems(false);
    };

    const handleCreateCombo = async () => {
        if (!newComboData.name || newComboData.price <= 0) {
            alert("Preencha nome e preço.");
            return;
        }

        setUploading(true);
        let finalImageUrl = newComboData.image_url;

        try {
            if (imageFile) {
                const compressedBlob = await compressImage(imageFile);
                const compressedFile = new File([compressedBlob], "combo.jpg", { type: "image/jpeg" });
                const fileName = `combo-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from("products") // Reusing products bucket
                    .upload(fileName, compressedFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("products").getPublicUrl(fileName);
                finalImageUrl = data.publicUrl;
            }

            if (isEditing && selectedComboId) {
                // Update existing
                const { error } = await supabase
                    .from('products')
                    .update({
                        name: newComboData.name,
                        price: newComboData.price,
                        description: newComboData.description,
                        category: newComboData.category,
                        image_url: finalImageUrl,
                    })
                    .eq('id', selectedComboId);

                if (error) throw error;

                setIsCreateDialogOpen(false);
                setIsEditing(false);
                setNewComboData({ name: "", price: 0, description: "", category: "Kits", image_url: "" });
                setImageFile(null);
                onRefresh();
            } else {
                // Create new
                const { error } = await supabase
                    .from('products')
                    .insert({
                        name: newComboData.name,
                        price: newComboData.price,
                        description: newComboData.description,
                        category: newComboData.category,
                        image_url: finalImageUrl,
                        is_combo: true,
                        stock_quantity: 0,
                        in_stock: true
                    })
                    .single();

                if (error) throw error;

                setIsCreateDialogOpen(false);
                setNewComboData({ name: "", price: 0, description: "", category: "Kits", image_url: "" });
                setImageFile(null);
                onRefresh();
            }
        } catch (error: any) {
            alert("Erro: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const openCreateDialog = () => {
        setIsEditing(false);
        setNewComboData({ name: "", price: 0, description: "", category: "Kits", image_url: "" });
        setIsCreateDialogOpen(true);
    };

    const openEditDialog = () => {
        if (!selectedCombo) return;
        setIsEditing(true);
        setNewComboData({
            name: selectedCombo.name,
            price: selectedCombo.price,
            description: selectedCombo.description,
            category: selectedCombo.category || "Kits",
            image_url: selectedCombo.image_url
        });
        setIsCreateDialogOpen(true);
    };

    const handleDeleteCombo = async () => {
        if (!selectedComboId) return;
        if (!confirm("Tem certeza que deseja EXCLUIR este combo? Essa ação não pode ser desfeita.")) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', selectedComboId);

        if (error) {
            alert("Erro: " + error.message);
        } else {
            setSelectedComboId(null);
            onRefresh();
        }
    };

    const handleAddItem = async (childProduct: Product) => {
        if (!selectedComboId) return;

        // Optimistic
        const newItem: ComboItem = {
            parent_product_id: selectedComboId,
            child_product_id: childProduct.id,
            quantity: 1,
            product: childProduct
        };
        setComboItems([...comboItems, newItem]);

        const { data, error } = await supabase
            .from('combo_items')
            .insert({
                parent_product_id: selectedComboId,
                child_product_id: childProduct.id,
                quantity: 1
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding item", error);
            alert("Erro ao adicionar item");
            fetchComboItems(selectedComboId); // Revert
        } else {
            // Update the optimistic item with real ID
            setComboItems(prev => prev.map(i => i.child_product_id === childProduct.id ? { ...i, id: data.id } : i));
        }
    };

    const handleUpdateQuantity = async (itemId: number, newQuantity: number, childId: number) => {
        if (newQuantity < 1) return;

        setComboItems(prev => prev.map(i => i.child_product_id === childId ? { ...i, quantity: newQuantity } : i));

        const { error } = await supabase
            .from('combo_items')
            .update({ quantity: newQuantity })
            .eq('id', itemId);

        if (error) {
            console.error("Error updating quantity", error);
        }
    };

    const handleRemoveItem = async (itemId: number, childId: number) => {
        setComboItems(prev => prev.filter(i => i.child_product_id !== childId));

        const { error } = await supabase
            .from('combo_items')
            .delete()
            .eq('id', itemId);

        if (error) {
            console.error("Error deleting item", error);
            alert("Erro ao remover item");
            if (selectedComboId) fetchComboItems(selectedComboId);
        }
    };

    // handleRemoveComboStatus removed in favor of handleDeleteCombo

    // Cost Calculation
    const currentCost = comboItems.reduce((acc, item) => {
        const p = item.product;
        if (!p) return acc;
        return acc + ((p.price || 0) * item.quantity);
    }, 0);

    const profitMargin = selectedCombo ? selectedCombo.price - currentCost : 0;
    const profitPercent = selectedCombo && selectedCombo.price > 0 ? (profitMargin / selectedCombo.price) * 100 : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {/* LEFT: List of Combos */}
            <Card className="bg-neutral-800 border-neutral-700 flex flex-col overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center justify-between">
                        <span>Seus Combos</span>
                        <Badge variant="outline" className="text-primary border-primary">{combos.length}</Badge>
                    </CardTitle>
                    <div className="relative mt-2 flex gap-2">
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openCreateDialog} className="w-full bg-primary text-black hover:bg-primary/90 font-bold">
                                    <Plus className="mr-2 h-4 w-4" /> Novo Combo
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                                <DialogHeader>
                                    <DialogTitle>{isEditing ? "Editar Combo" : "Criar Novo Combo"}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Nome do Combo</Label>
                                        <Input
                                            value={newComboData.name}
                                            onChange={e => setNewComboData({ ...newComboData, name: e.target.value })}
                                            className="bg-neutral-800 border-neutral-700"
                                            placeholder="Ex: Kit Esquenta"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Preço de Venda (R$)</Label>
                                        <Input
                                            type="number"
                                            value={newComboData.price}
                                            onChange={e => setNewComboData({ ...newComboData, price: parseFloat(e.target.value) })}
                                            className="bg-neutral-800 border-neutral-700"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Categoria</Label>
                                        <Input
                                            value={newComboData.category}
                                            onChange={e => setNewComboData({ ...newComboData, category: e.target.value })}
                                            className="bg-neutral-800 border-neutral-700"
                                            placeholder="Kits"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <textarea
                                            value={newComboData.description}
                                            onChange={e => setNewComboData({ ...newComboData, description: e.target.value })}
                                            className="flex min-h-[80px] w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Descreva o que vem no kit..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Imagem do Combo</Label>
                                        <ImageUpload
                                            value={newComboData.image_url}
                                            onChange={(fileOrUrl) => {
                                                if (fileOrUrl instanceof File) {
                                                    setImageFile(fileOrUrl);
                                                    // Don't set image_url here, only preview logic inside component handles instant preview,
                                                    // but we might want to clear URL if file is removed?
                                                    // ImageUpload component handles preview internally for File.
                                                    // But we should probably keep image_url for existing URLs.
                                                } else {
                                                    setImageFile(null);
                                                    setNewComboData({ ...newComboData, image_url: fileOrUrl as string || "" });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-neutral-700 text-white hover:bg-neutral-800">Cancelar</Button>
                                    <Button onClick={handleCreateCombo} disabled={uploading} className="bg-primary text-black hover:bg-primary/90">
                                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isEditing ? "Salvar Alterações" : "Criar Combo"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                        <Input
                            placeholder="Buscar combos..."
                            className="bg-neutral-900 border-neutral-700 pl-8 text-white h-9"
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-2 p-2">
                    {combos.map(combo => (
                        <div
                            key={combo.id}
                            onClick={() => setSelectedComboId(combo.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${selectedComboId === combo.id
                                ? 'bg-primary/20 border-primary'
                                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                                }`}
                        >
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center shrink-0">
                                {combo.image_url ? (
                                    <img src={combo.image_url} className="w-full h-full object-contain p-1" />
                                ) : (
                                    <Package className="text-neutral-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-neutral-200 truncate">{combo.name}</h4>
                                <p className="text-xs text-neutral-500">R$ {combo.price.toFixed(2)}</p>
                            </div>
                            <ArrowRight className={`w-4 h-4 ${selectedComboId === combo.id ? 'text-primary' : 'text-neutral-600'}`} />
                        </div>
                    ))}

                    {combos.length === 0 && (
                        <div className="text-center py-10 text-neutral-500 px-4">
                            <p className="mb-2">Você ainda não definiu nenhum combo.</p>
                            <p className="text-xs">Crie um produto "Kit" normal e depois selecione-o abaixo para configurar.</p>
                        </div>
                    )}


                </CardContent>
            </Card>

            {/* RIGHT: Editor */}
            <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
                {selectedCombo ? (
                    <>
                        {/* Editor Header */}
                        <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-white rounded-lg p-2 shrink-0">
                                    <img src={selectedCombo.image_url} alt={selectedCombo.name} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-primary text-black hover:bg-primary">COMBO ATIVO</Badge>
                                        <span className="text-xs text-neutral-500">ID: {selectedCombo.id}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1">{selectedCombo.name}</h2>
                                    <p className="text-neutral-400 text-sm">{selectedCombo.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-neutral-500 mb-1">Preço de Venda</div>
                                <div className="text-2xl font-black text-white">R$ {selectedCombo.price.toFixed(2)}</div>
                                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white hover:bg-white/10 h-8 px-2 mt-2 mr-2" onClick={openEditDialog}>
                                    <Pencil className="w-4 h-4 mr-2" /> Editar
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-900/20 h-8 px-2 mt-2" onClick={handleDeleteCombo}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir Combo
                                </Button>
                            </div>
                        </div>

                        {/* Items Editor */}
                        <Card className="bg-neutral-800 border-neutral-700 flex-1 flex flex-col min-h-0">
                            <CardHeader className="border-b border-neutral-700 py-4">
                                <CardTitle className="text-base text-white flex justify-between items-center">
                                    Items do Combo
                                    <div className="text-sm font-normal text-neutral-400">
                                        Custo dos itens: <span className="text-white font-bold">R$ {currentCost.toFixed(2)}</span>
                                        {profitMargin < 0 && <span className="text-red-500 ml-2 font-bold">(Prejuízo)</span>}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex flex-1 min-h-0">
                                {/* Items List */}
                                <div className="w-1/2 border-r border-neutral-700 overflow-y-auto p-4 space-y-3">
                                    {comboItems.map((item) => (
                                        <div key={item.id || `temp-${item.child_product_id}`} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 flex gap-3 items-center">
                                            <img src={item.product?.image_url} className="w-10 h-10 bg-white rounded object-contain p-1" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-neutral-200 text-sm truncate">{item.product?.name}</div>
                                                <div className="text-xs text-neutral-500">
                                                    R$ {item.product?.price.toFixed(2)} unit.
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    className="w-12 bg-neutral-950 border border-neutral-700 rounded text-center text-white h-8"
                                                    value={item.quantity}
                                                    onChange={(e) => item.id && handleUpdateQuantity(item.id, parseInt(e.target.value), item.child_product_id)}
                                                    min="1"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:bg-red-900/20"
                                                    onClick={() => item.id && handleRemoveItem(item.id, item.child_product_id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {comboItems.length === 0 && (
                                        <div className="text-center py-12 text-neutral-500">
                                            <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>Nenhum item adicionado.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Product Selector */}
                                <div className="w-1/2 flex flex-col">
                                    <div className="p-4 border-b border-neutral-700">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                                            <Input
                                                placeholder="Adicionar produto ao combo..."
                                                className="bg-neutral-900 border-neutral-700 pl-9 text-white"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2">
                                        {availableItems
                                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                            // .slice(0, 20) // Limit results for perf
                                            .map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleAddItem(product)}
                                                    className="w-full text-left p-2 hover:bg-neutral-700/50 rounded-lg flex items-center gap-3 group transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 text-neutral-500 group-hover:text-primary" />
                                                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                                        <img src={product.image_url} className="w-full h-full object-contain p-0.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-neutral-300 truncate group-hover:text-white">{product.name}</div>
                                                        <div className="text-xs text-neutral-500">Estoque: {product.stock_quantity || 0}</div>
                                                    </div>
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="flex-1 bg-neutral-800 rounded-xl border border-neutral-700 flex flex-col items-center justify-center text-neutral-500">
                        <Package className="w-20 h-20 mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-neutral-400">Gerenciador de Combos</h3>
                        <p className="max-w-md text-center mt-2">Selecione um combo ao lado para editar ou converta um produto existente em um novo combo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
