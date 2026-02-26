export type Category = {
  slug: string;
  label: string;
  dir: string;
};

export const CATEGORIES: Category[] = [
  { slug: "landscape", label: "風景写真", dir: "landscape" },
  { slug: "portrait", label: "ポートレート", dir: "portrait" },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
