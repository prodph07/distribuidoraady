
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Product, Category, Subcategory } from "@/types";

interface ProductFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingProduct: Product | null;
    categories: Category[];
    subcategories: Subcategory[];
    onSave: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function ProductFormDialog({
    isOpen,
    onOpenChange,
    editingProduct,
    categories,
    subcategories,
    onSave
}: ProductFormDialogProps) {
    const [isReturnable, setIsReturnable] = useState(false);

    // Sync isReturnable when editingProduct changes
    useEffect(() => {
        if (editingProduct) {
            setIsReturnable(!!editingProduct.is_returnable);
        } else {
            setIsReturnable(false);
        }
    }, [editingProduct, isOpen]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        await onSave(e);
        // We rely on parent to close modal or reset, but usually good to have local handling if needed
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingProduct ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        {editingProduct ? "Atualize os dados do produto." : "Preencha os dados da cerveja para adicionar ao catálogo."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Produto</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={editingProduct?.name}
                            placeholder="Ex: Skol 300ml"
                            className="bg-neutral-800 border-neutral-700 text-white"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoria</Label>
                            <select
                                id="category"
                                name="category"
                                defaultValue={editingProduct?.category || ""}
                                className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                <option value="">Selecione...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subcategory">Subcategoria</Label>
                            <select
                                id="subcategory"
                                name="subcategory"
                                defaultValue={editingProduct?.subcategory || ""}
                                className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                <option value="">Selecione...</option>
                                {subcategories.map(sc => (
                                    <option key={sc.id} value={sc.name}>{sc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4 bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                        <input type="hidden" name="is_returnable" value={isReturnable ? "on" : "off"} />
                        <Switch
                            checked={isReturnable}
                            onCheckedChange={setIsReturnable}
                            id="is_returnable"
                        />
                        <Label htmlFor="is_returnable" className="cursor-pointer">
                            Produto Retornável? (Cobrar Casco)
                        </Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Liquid / Base Inputs */}
                        <div className="grid gap-2">
                            <Label htmlFor="price">{isReturnable ? "Venda (Líquido/Refil)" : "Preço Venda (R$)"}</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                defaultValue={editingProduct?.price}
                                placeholder="0.00"
                                className="bg-neutral-800 border-neutral-700 text-white"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cost_price">{isReturnable ? "Custo (Líquido)" : "Preço Custo (R$)"}</Label>
                            <Input
                                id="cost_price"
                                name="cost_price"
                                type="number"
                                step="0.01"
                                defaultValue={editingProduct?.cost_price || ""}
                                placeholder="0.00"
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>

                        {/* Returnable Extra Inputs - HIDDEN (We don't sell bottles anymore, only liquid) */}
                        {/* 
                        {isReturnable && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="deposit_price" className="text-yellow-400">Venda do Casco (Depósito)</Label>
                                    <Input
                                        id="deposit_price"
                                        name="deposit_price"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingProduct?.deposit_price || ""}
                                        placeholder="Ex: 5.00"
                                        className="bg-neutral-800 border-yellow-500/30 text-white"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="bottle_cost" className="text-yellow-400">Custo do Casco</Label>
                                    <Input
                                        id="bottle_cost"
                                        name="bottle_cost"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingProduct?.bottle_cost || ""}
                                        placeholder="Ex: 2.50"
                                        className="bg-neutral-800 border-yellow-500/30 text-white"
                                    />
                                </div>
                            </>
                        )} 
                        */}

                        <div className="grid gap-2">
                            <Label htmlFor="stock_quantity">Qtd Inicial</Label>
                            <Input
                                id="stock_quantity"
                                name="stock_quantity"
                                type="number"
                                defaultValue={editingProduct?.stock_quantity || 0}
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="image_url">URL da Imagem</Label>
                        <Input
                            id="image_url"
                            name="image_url"
                            defaultValue={editingProduct?.image_url}
                            placeholder="https://..."
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-primary text-black hover:bg-yellow-400 font-bold">
                        {editingProduct ? "Atualizar Produto" : "Salvar Produto"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
