export type RegulatoryStatus = 'pendiente' | 'aprobado' | 'rechazado';
export type CommercialStatus = 'borrador' | 'activo' | 'agotado' | 'oculto';
export type OrderStatus = 'pendiente' | 'pagado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado' | 'reembolsado';
export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'devolucion';
export type DiscountType = 'percentage' | 'fixed';
export type UserRole = 'client' | 'admin' | 'editor' | 'compliance_officer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description_short: string;
  description_long: string | null;
  brand_id: string | null;
  category_id: string | null;
  is_consumable: boolean;
  price_regular: number;
  price_promo: number | null;
  cost_internal?: number;
  stock_minimum: number;
  weight_grams: number;
  dimensions_cm: string | null;
  commercial_status: CommercialStatus;
  regulatory_status: RegulatoryStatus;
  seo_title?: string | null;
  seo_meta_description?: string | null;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  category?: Category;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  barcode?: string | null;
  flavor?: string | null;
  size?: string | null;
  presentation?: string | null;
  price_override?: number | null;
  stock_available: number;
  stock_reserved: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface InventoryLot {
  id: string;
  variant_id: string;
  lot_number: string;
  expiration_date: string;
  quantity: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  user_id?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  shipping_address: {
    full_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
  };
  customer_email: string;
  customer_phone: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id?: string | null;
  product_name: string;
  variant_name?: string | null;
  price_at_purchase: number;
  quantity: number;
}
