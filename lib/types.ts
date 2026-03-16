export type Product = {
  id: number;
  name: string | null;
  url: string;
  active: boolean;
  created_at: string;
  last_price: number | null;
  last_checked_at: string | null;
  image_url: string | null;
};

export type UpdateResult = {
  product_id: number;
  name: string | null;
  url: string;
  ok: boolean;
  price?: number;
  source?: string;
  image_url?: string | null;
  checked_at?: string;
  error?: string;
};

export type PricePoint = {
  checked_at: string;
  price: number;
  source: string;
};

export type HistoryResponse = {
  product: Product;
  history: PricePoint[];
};
