export interface EventItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  governorate: string;
  location: string;
  mode: 'حضوري' | 'أونلاين' | 'هجين';
  starts_at: string;
  ends_at: string | null;
  description: string;
  seats_total: number;
  seats_taken: number;
  seats_remaining: number;
  price: string | null;
  organizer: string | null;
  status: 'upcoming' | 'past';
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  is_published: boolean;
}

export interface EventItemPayload {
  title: string;
  category: string;
  governorate: string;
  location: string;
  mode?: EventItem['mode'];
  starts_at: string;
  ends_at?: string;
  description: string;
  seats_total: number;
  price?: string;
  organizer?: string;
  art_theme?: EventItem['art_theme'];
  is_published?: boolean;
}

export interface Booking {
  id: number;
  event_id: number;
  confirmation_code: string;
  full_name: string;
  phone: string;
  email: string;
  governorate: string | null;
  notes: string | null;
  created_at: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  category: string;
  governorate: string;
  author: string;
  excerpt: string;
  content: string;
  tags: string[] | null;
  read_minutes: number;
  views: number;
  likes: number;
  is_featured: boolean;
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  published_at: string;
  is_published: boolean;
}

export interface ArticleItemPayload {
  title: string;
  category: string;
  governorate?: string;
  author: string;
  excerpt: string;
  content: string;
  tags?: string[];
  read_minutes?: number;
  is_featured?: boolean;
  is_published?: boolean;
}

export interface Program {
  id: number;
  title: string;
  category: 'التعليم' | 'السياحة' | 'التضامن' | 'الزراعة' | 'الإعلام' | 'الصحة';
  description: string;
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  order: number;
  is_published: boolean;
}

export interface Governorate {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  population: string;
  projects_completed: number;
  completion_percentage: number;
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  order: number;
  is_published: boolean;
}

export interface SuccessStory {
  id: number;
  name: string;
  role_title: string;
  governorate: string | null;
  quote: string;
  order: number;
  is_published: boolean;
}

export interface GalleryImage {
  id: number;
  title: string;
  caption: string | null;
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  image_path: string | null;
  order: number;
  is_published: boolean;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  governorate?: string;
  message: string;
}

export type AdminRole = 'super_admin' | 'editor' | 'viewer';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
}

export interface AdminUserPayload {
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
