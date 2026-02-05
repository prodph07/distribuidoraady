export interface Product {
    id: number;
    name: string;
    description: string;
    image_url: string;
    price: number;
    deposit_price: number;
    is_returnable: boolean;
    in_stock: boolean;
    stock_quantity: number;
    category?: string; // e.g. 'Cervejas', 'Destilados'
    subcategory?: string; // e.g. 'Pilsen', 'Vodka'
    cost_price?: number;
    bottle_cost?: number;
    is_combo?: boolean;
    calculated_stock?: number;
}

export interface Category {
    id: number;
    name: string;
}

export interface Subcategory {
    id: number;
    name: string;
    category_id: number;
}

export interface CartItem extends Product {
    quantity: number;
    has_exchange: boolean; // true if user has bottle (only liquid price), false if user buys bottle (liquid + deposit)
}

export interface OrderItem {
    order_id: string;
    product_id: number;
    quantity: number;
    price_snapshot: number;
    is_exchange: boolean;
    product?: Product; // joined (legacy/alias)
    products?: Product; // joined from supabase (default)
}

export interface Order {
    id: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    address: string;
    payment_id: string | null;
    total_amount: number;
    created_at: string;
    payment_method?: 'pix' | 'money' | 'card_machine';
    change_needed?: number;
    archived?: boolean;
    order_items?: OrderItem[];
    total?: number; // legacy prop compatibility if needed, or alias total_amount
}

export interface Banner {
    id: number;
    title?: string;
    image_url: string;
    link_url?: string;
    position: 'main' | 'secondary';
    order_index: number;
    active: boolean;
}

export interface Collection {
    id: number;
    title: string;
    slug: string;
    description?: string;
    image_url?: string;
    active: boolean;
    featured: boolean;
}

export interface CollectionItem {
    id: number;
    collection_id: number;
    product_id: number;
    product?: Product;
}

export interface HomeSection {
    slug: string; // 'coupon', 'categories', 'carnaval', etc.
    name: string;
    active: boolean;
    config: Record<string, any>; // { title, subtitle, image_url, etc. }
    order_index: number;
}
export interface StoreSettings {
    id: number;
    stripe_account_id?: string;
    stripe_details?: any;
}
