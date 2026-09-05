export interface Product {
  id: string;
  name: string;
  localName?: string;
  category: string;
  price: number; // in Nigerian Naira (₦)
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  imageUrls: string[];
  freshnessScore: number; // 0-100
  freshnessText: string; // e.g., "Harvested yesterday", "Freshly baked"
  harvestDate?: string;
  expiryDate?: string;
  nutritionFacts: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    fiber?: string;
  };
  ingredients?: string[];
  allergenInfo?: string;
  storageInstructions: string;
  origin: string; // e.g., "Jos, Plateau State", "Oyo Farm"
  description: string;
  size: string; // e.g., "1kg", "5kg bag", "1 pack"
  sizes?: string[]; // available sizes for selection
  stock: number;
  isOrganic: boolean;
  isImported: boolean;
  deliveryTimeEstimate: string; // e.g., "30-45 mins", "Same day"
}

export interface Recipe {
  id: string;
  name: string;
  category: string; // e.g., "Soups", "Rice Dishes", "Breakfast"
  prepTime: string;
  cookingTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servingSize: string;
  calories: number;
  nutritionFacts: {
    protein: string;
    carbs: string;
    fat: string;
  };
  ingredients: {
    productId?: string; // linked product
    name: string;
    amount: string;
    alternative?: string; // smart substitute if out of stock
  }[];
  instructions: string[];
  chefTips: string[];
  rating: number;
  commentsCount: number;
  imageUrl: string;
  isNigerian: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  date: string;
  status: 'Received' | 'Confirmed' | 'Picking' | 'Inspection' | 'Packed' | 'OutForDelivery' | 'Nearby' | 'Delivered';
  deliveryAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    phone: string;
  };
  riderName?: string;
  riderPhone?: string;
  otp?: string;
  estimatedArrival?: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  date: string;
  content: string[];
  imageUrl: string;
  relatedProducts: string[]; // product IDs
}

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsCost: number;
  description: string;
  code: string;
  type: 'discount' | 'free_delivery' | 'gift';
}

export interface ReferralMilestone {
  id: string;
  friendsCount: number;
  rewardName: string;
  rewardValue: string;
  description: string;
  unlocked: boolean;
}

export interface MealPlanDay {
  day: string; // "Monday", "Tuesday", etc.
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner?: Recipe;
}

export interface UserProfileData {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  streetAddress: string;
  cityArea: string;
  state: string;
  deliveryNotes?: string;
  dietaryPreference: string;
  favoriteCategory: string;
  completedAt: string;
  updatedAt?: string;
  backendSynced?: boolean;
}
