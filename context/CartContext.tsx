import React, { createContext, ReactNode, useContext, useState } from 'react';

export type CartItem = {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  restaurantId: string;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (_id: string) => void;
  clearCart: () => void;
  getCartItems: () => CartItem[];
  restaurantId: string | null;
  pendingItem: CartItem | null;
  confirmAddFromNewRestaurant: (confirm: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<CartItem | null>(null);
  const [confirmationCallback, setConfirmationCallback] = useState<((confirm: boolean) => void) | null>(null);

  const addToCart = (item: CartItem) => {
    console.log(cart);
    if (cart.length > 0 && restaurantId && restaurantId !== item.restaurantId) {
      setPendingItem(item);
      // The UI should show a confirmation dialog and call confirmAddFromNewRestaurant
      return;
    }
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i._id === item._id);
      if (existing) {
        return prevCart.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prevCart, item];
    });
    setRestaurantId(item.restaurantId);
  };

  const confirmAddFromNewRestaurant = (confirm: boolean) => {
    if (confirm && pendingItem) {
      setCart([pendingItem]);
      setRestaurantId(pendingItem.restaurantId);
    }
    setPendingItem(null);
  };

  const removeFromCart = (_id: string) => {
    setCart((prevCart) => {
      const updated = prevCart.filter((item) => item._id !== _id);
      if (updated.length === 0) setRestaurantId(null);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setRestaurantId(null);
  };

  const getCartItems = () => cart;

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getCartItems, restaurantId, pendingItem, confirmAddFromNewRestaurant }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 