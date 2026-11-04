export type Tour = {
  slug: string;
  title: string;
  location: string;
  duration: string;
  rating: number;
  reviews: number;
  priceNet: number;
  priceFrom?: number;
  ribbon?: string;
  tone: string;
};