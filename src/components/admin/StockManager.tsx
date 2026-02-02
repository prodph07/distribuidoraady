"use client";

import { useState } from "react";
import { Product, Category, Subcategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Search,
    Plus,
    Minus,
    Pencil,
    Trash2,
    Settings,
    MoreHorizontal,
    AlertCircle
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface StockManagerProps {
    products: Product[];
    categories: Category[];
    subcategories: Subcategory[];
    onEditProduct: (product: Product) => void;
    onAddProduct: () => void;
    onManageCategories: () => void;
    // Actions passed from parent to update state there
    onToggleStock: (id: number, currentStatus: boolean) => Promise<void>;
    onUpdateStockQuantity: (id: number, delta: number) => Promise<void>;
    onDeleteProduct: (id: number) => Promise<void>;
}

export function StockManager({
    products,
    categories,
    subcategories,
    onEditProduct,
    onAddProduct,
    onManageCategories,
    onToggleStock,
    onUpdateStockQuantity,
    onDeleteProduct
}: StockManagerProps) {
    // Local filters state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

    const filteredProducts = products.filter(p => {
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (selectedCategory !== 'Todas' && p.category !== selectedCategory) return false;
        if (selectedSubcategory && p.subcategory !== selectedSubcategory) return false;
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                        <Input
                            placeholder="Buscar produto..."
                            className="pl-9 bg-neutral-950 border-neutral-800 focus:border-primary/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={onManageCategories} className="border-neutral-700 hover:bg-neutral-800 text-neutral-300">
                        <Settings className="w-4 h-4 mr-2" /> Categorias
                    </Button>
                    <Button onClick={onAddProduct} size="sm" className="bg-primary text-black hover:bg-yellow-500 font-bold">
                        <Plus className="w-4 h-4 mr-2" /> Novo Produto
                    </Button>
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={selectedCategory === 'Todas' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                        setSelectedCategory('Todas');
                        setSelectedSubcategory(null);
                    }}
                    className={`rounded-full px-4 ${selectedCategory === 'Todas' ? "bg-white text-black hover:bg-neutral-200" : "bg-transparent border-neutral-800 text-neutral-400"}`}
                >
                    Todos
                </Button>
                {categories.map(cat => (
                    <Button
                        key={cat.id}
                        variant={selectedCategory === cat.name ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => {
                            setSelectedCategory(cat.name);
                            setSelectedSubcategory(null);
                        }}
                        className={`rounded-full px-4 ${selectedCategory === cat.name ? "bg-white text-black hover:bg-neutral-200" : "bg-transparent border-neutral-800 text-neutral-400"}`}
                    >
                        {cat.name}
                    </Button>
                ))}
            </div>

            {/* Subcategories Filter */}
            {selectedCategory !== 'Todas' && (
                <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-neutral-800">
                    <div className="text-xs text-neutral-500 flex items-center mr-2 font-medium">Subcategorias:</div>
                    <button
                        onClick={() => setSelectedSubcategory(null)}
                        className={`px-3 py-1 border rounded-full text-xs transition-colors ${selectedSubcategory === null ? "bg-neutral-800 text-white border-neutral-700 font-bold" : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-300"}`}
                    >
                        Todas
                    </button>
                    {subcategories
                        .filter(sc => {
                            const parent = categories.find(c => c.name === selectedCategory);
                            return parent && sc.category_id === parent.id;
                        })
                        .map(sc => (
                            <button
                                key={sc.id}
                                onClick={() => setSelectedSubcategory(selectedSubcategory === sc.name ? null : sc.name)}
                                className={`px-3 py-1 border rounded-full text-xs transition-colors ${selectedSubcategory === sc.name ? "bg-neutral-800 text-white border-neutral-700 font-bold" : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-300"}`}
                            >
                                {sc.name}
                            </button>
                        ))
                    }
                </div>
            )}

            {/* Stock Table */}
            <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-900/30">
                <Table>
                    <TableHeader className="bg-neutral-900">
                        <TableRow className="border-neutral-800 hover:bg-neutral-900">
                            <TableHead className="w-[80px]">Img</TableHead>
                            <TableHead className="w-[300px]">Produto</TableHead>
                            <TableHead>Preços</TableHead>
                            <TableHead className="text-center">Estoque</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow key={product.id} className="border-neutral-800 hover:bg-neutral-900/50 transition-colors">
                                {/* Image */}
                                <TableCell>
                                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700 relative group">
                                        <img
                                            src={product.image_url || 'https://via.placeholder.com/150'}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </TableCell>

                                {/* Product Info */}
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className={`font-medium text-base ${!product.in_stock && "text-neutral-500 line-through"}`}>
                                            {product.name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {product.category && (
                                                <Badge variant="outline" className="text-[10px] bg-neutral-950 border-neutral-800 text-neutral-400 uppercase tracking-wide">
                                                    {product.category} {product.subcategory && `• ${product.subcategory}`}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Prices */}
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-neutral-400 w-12">Venda:</span>
                                            <span className="font-bold text-neutral-200">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || 0)}
                                            </span>
                                        </div>
                                        {(product.cost_price || 0) > 0 && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-neutral-500 w-12">Lucro:</span>
                                                <span className={`font-medium ${(product.price - (product.cost_price || 0)) > 0 ? "text-green-500" : "text-red-500"}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price - (product.cost_price || 0))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Stock Control */}
                                <TableCell>
                                    <div className="flex items-center justify-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => onUpdateStockQuantity(product.id, -1)}
                                            className="h-8 w-8 border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                                        >
                                            <Minus size={14} />
                                        </Button>
                                        <div className={`min-w-[40px] text-center font-mono font-bold text-lg ${(product.stock_quantity || 0) < 5 ? "text-red-500" : "text-white"
                                            }`}>
                                            {product.stock_quantity || 0}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => onUpdateStockQuantity(product.id, 1)}
                                            className="h-8 w-8 border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                                        >
                                            <Plus size={14} />
                                        </Button>
                                    </div>
                                    {(product.stock_quantity || 0) < 5 && (
                                        <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-red-500 font-medium">
                                            <AlertCircle size={10} />
                                            <span>Baixo estoque</span>
                                        </div>
                                    )}
                                </TableCell>

                                {/* Status */}
                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <Switch
                                            checked={product.in_stock}
                                            onCheckedChange={() => onToggleStock(product.id, product.in_stock)}
                                            className="data-[state=unchecked]:bg-neutral-800 data-[state=checked]:bg-green-600"
                                        />
                                    </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-white">
                                                <span className="sr-only">Abrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() => onEditProduct(product)}
                                                className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800"
                                            >
                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-neutral-800" />
                                            <DropdownMenuItem
                                                onClick={() => onDeleteProduct(product.id)}
                                                className="cursor-pointer text-red-500 hover:bg-red-900/20 focus:bg-red-900/20 focus:text-red-500"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-neutral-500 bg-neutral-900/20 rounded-xl border border-dashed border-neutral-800">
                    <Search className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-400">Nenhum produto encontrado</h3>
                    <p className="text-sm">Tente ajustar seus filtros ou adicione um novo produto.</p>
                </div>
            )}
        </div>
    );
}
