export type Transport = {
  slug: string;
  model: string;
  category: string;
  seats: number;
  bags: number;
  priceNet: number;
  priceFrom?: number;
  ribbon?: string;
  tone: string;
};