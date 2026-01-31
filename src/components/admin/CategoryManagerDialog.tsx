"use client";

import { useState } from "react";
import { Category, Subcategory } from "@/types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface CategoryManagerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    subcategories: Subcategory[];
    onRefresh: () => void;
}

export function CategoryManagerDialog({
    isOpen,
    onOpenChange,
    categories,
    subcategories,
    onRefresh
}: CategoryManagerDialogProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

    const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('cat_name') as string;
        if (!name) return;
        await supabase.from('categories').insert({ name });
        onRefresh();
        (e.target as HTMLFormElement).reset();
    };

    const handleAddSubcategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('sub_name') as string;
        const category_id = formData.get('cat_id') as string;
        if (!name || !category_id) return;
        await supabase.from('subcategories').insert({ name, category_id: parseInt(category_id) });
        onRefresh();
        (e.target as HTMLFormElement).reset();
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Excluir categoria? Isso pode afetar subcategorias.")) return;
        await supabase.from('categories').delete().eq('id', id);
        onRefresh();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Gerenciar Categorias e Subcategorias</DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-8 mt-4">
                    {/* Categories Column */}
                    <div>
                        <h3 className="font-bold mb-3 text-primary">Categorias</h3>
                        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                            <Input name="cat_name" placeholder="Nova Categoria" className="bg-neutral-800 border-neutral-700 h-8" required />
                            <Button type="submit" size="sm" className="bg-primary text-black hover:bg-yellow-500">+</Button>
                        </form>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {categories.map(c => (
                                <div key={c.id} className="flex justify-between items-center bg-neutral-950 p-2 rounded border border-neutral-800">
                                    <span>{c.name}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-neutral-900" onClick={() => handleDeleteCategory(c.id)}><Trash2 size={12} /></Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subcategories Column */}
                    <div>
                        <h3 className="font-bold mb-3 text-neutral-300">Subcategorias</h3>
                        <form onSubmit={handleAddSubcategory} className="space-y-2 mb-4">
                            <select name="cat_id" className="w-full bg-neutral-800 border border-neutral-700 rounded p-1 text-sm text-white" required>
                                <option value="">Selecione a Categoria Pai...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <Input name="sub_name" placeholder="Nova Subcategoria" className="bg-neutral-800 border-neutral-700 h-8" required />
                                <Button type="submit" size="sm" className="bg-neutral-700 hover:bg-neutral-600">+</Button>
                            </div>
                        </form>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {subcategories.map(sc => {
                                // Find parent for display if needed, logic taken from original
                                const parent = categories.find(c => c.id === sc.category_id);
                                return (
                                    <div key={sc.id} className="flex justify-between items-center bg-neutral-950 p-2 rounded border border-neutral-800">
                                        <div className="flex flex-col">
                                            <span>{sc.name}</span>
                                            <span className="text-[10px] text-neutral-500">{parent?.name}</span>
                                        </div>
                                        {/* Add delete logic for subcategory later if needed */}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
