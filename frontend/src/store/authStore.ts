import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'restaurant_admin' | 'staff';
  restaurantId?: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  address: string;
  contact: string;
  gstNumber?: string;
  taxRate: number;
  theme?: {
    primaryColor?: string;
    darkMode?: boolean;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  restaurant: Restaurant | null;
  setAuth: (token: string, user: User, restaurant: Restaurant | null) => void;
  clearAuth: () => void;
  updateRestaurant: (restaurant: Restaurant) => void;
}

const getSafeLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setSafeLocalStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

const removeSafeLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getSafeLocalStorage('token'),
  user: getSafeLocalStorage('user') ? JSON.parse(getSafeLocalStorage('user')!) : null,
  restaurant: getSafeLocalStorage('restaurant') ? JSON.parse(getSafeLocalStorage('restaurant')!) : null,
  setAuth: (token, user, restaurant) => {
    setSafeLocalStorage('token', token);
    setSafeLocalStorage('user', JSON.stringify(user));
    if (restaurant) {
      setSafeLocalStorage('restaurant', JSON.stringify(restaurant));
    } else {
      removeSafeLocalStorage('restaurant');
    }
    set({ token, user, restaurant });
  },
  clearAuth: () => {
    removeSafeLocalStorage('token');
    removeSafeLocalStorage('user');
    removeSafeLocalStorage('restaurant');
    set({ token: null, user: null, restaurant: null });
  },
  updateRestaurant: (restaurant) => {
    setSafeLocalStorage('restaurant', JSON.stringify(restaurant));
    set({ restaurant });
  },
}));
