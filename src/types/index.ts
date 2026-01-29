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
    product?: Product; // joined
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
    order_items?: OrderItem[];
    total?: number; // legacy prop compatibility if needed, or alias total_amount
}
