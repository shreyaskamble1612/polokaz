import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCategoryName(category: string | null): string {
  if (!category) return "General";
  
  const trimmed = category.trim();
  if (!trimmed) return "General";

  const standardLabels: Record<string, string> = {
    food: "Food & Dining",
    "food & drink": "Food & Drink",
    "food & drinks": "Food & Drinks",
    "food & dining": "Food & Dining",
    dining: "Food & Dining",
    restaurant: "Food & Dining",
    restaurants: "Food & Dining",
    health: "Wellness",
    wellness: "Wellness",
    "health & wellness": "Health & Wellness",
    beauty: "Beauty & Fitness",
    "beauty & fitness": "Beauty & Fitness",
    "beauty & personal care": "Beauty & Personal Care",
    retail: "Retail & Shopping",
    "retail & shopping": "Retail & Shopping",
    shopping: "Retail & Shopping",
    education: "Education",
    entertainment: "Entertainment",
    travel: "Travel",
  };

  const key = trimmed.toLowerCase();
  if (standardLabels[key]) {
    return standardLabels[key];
  }

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.toLowerCase() === "&") return "&";
      if (word.toLowerCase() === "and") return "and";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
