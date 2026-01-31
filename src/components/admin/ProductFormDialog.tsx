
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Product, Category, Subcategory } from "@/types";
import { compressImage } from "@/lib/imageUtils";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface ProductFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingProduct: Product | null;
    categories: Category[];
    subcategories: Subcategory[];
    onSave: (formData: FormData) => Promise<void>;
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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Sync isReturnable and preview when editingProduct changes
    useEffect(() => {
        if (editingProduct) {
            setIsReturnable(!!editingProduct.is_returnable);
            setPreviewUrl(editingProduct.image_url);
        } else {
            setIsReturnable(false);
            setPreviewUrl(null);
        }
        setImageFile(null); // Reset new file
    }, [editingProduct, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
    };



    // REWRITE handle submit more cleanly:
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);

        const form = e.currentTarget;

        try {
            let finalImageUrl = editingProduct?.image_url || "";

            if (imageFile) {
                const compressedBlob = await compressImage(imageFile);
                const compressedFile = new File([compressedBlob], "image.jpg", { type: "image/jpeg" });
                const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

                const { error } = await supabase.storage
                    .from("products")
                    .upload(fileName, compressedFile);

                if (error) throw error;

                const { data } = supabase.storage.from("products").getPublicUrl(fileName);
                finalImageUrl = data.publicUrl;
            } else if (!previewUrl) {
                finalImageUrl = "";
            }

            // Update the hidden input value so the parent's `new FormData(e.currentTarget)` picks it up
            const imageInput = form.querySelector('input[name="image_url"]') as HTMLInputElement;
            if (imageInput) {
                imageInput.value = finalImageUrl;
            }

            const formData = new FormData(form);
            // Ensure image_url is set in FormData even if DOM update lagged (manual override)
            formData.set("image_url", finalImageUrl);
            // Ensure is_returnable is set correctly
            formData.set("is_returnable", isReturnable ? "on" : "off");

            await onSave(formData);

        } catch (error: any) {
            console.error("Upload error:", error);
            const msg = error.message || "Erro desconhecido";
            alert(`Erro ao salvar imagem: ${msg}. Verifique as permissões do Bucket 'products'.`);
        } finally {
            setUploading(false);
        }
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
                <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
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
                        <Label>Imagem do Produto</Label>

                        {/* Hidden Input for Form Submission */}
                        <input type="hidden" name="image_url" defaultValue={editingProduct?.image_url || ""} />

                        <div className="flex flex-col gap-4">
                            {previewUrl ? (
                                <div className="relative w-full aspect-video bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 group">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        className="object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-800/50 hover:border-primary/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                                        <p className="text-sm text-neutral-400">Clique para selecionar uma imagem</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={uploading}
                        className="w-full bg-primary text-black hover:bg-yellow-400 font-bold"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            editingProduct ? "Atualizar Produto" : "Salvar Produto"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
