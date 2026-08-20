import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  campaignId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: typeof window !== 'undefined' && localStorage.getItem('cart')
    ? JSON.parse(localStorage.getItem('cart')!)
    : [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(i => i.campaignId === action.payload.campaignId);
      if (existing) {
        if (existing.quantity < existing.stock) {
          existing.quantity += action.payload.quantity;
        }
      } else {
        state.items.push(action.payload);
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.campaignId !== action.payload);
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action: PayloadAction<{ campaignId: string; quantity: number }>) => {
      const item = state.items.find(i => i.campaignId === action.payload.campaignId);
      if (item) {
        if (action.payload.quantity > 0 && action.payload.quantity <= item.stock) {
          item.quantity = action.payload.quantity;
        }
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cart');
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
