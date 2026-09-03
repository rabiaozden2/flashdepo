import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
    id: string;
    warehouse_id: string;
    name: string;
    description: string;
    original_price: number;
    stock: number;
    image_url?: string;
}

export interface Campaign {
    id: string;
    product_id: string;
    product: Product;
    campaign_stock: number;
    discount_percentage: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

interface CampaignState {
    campaigns: Campaign[];
    loading: boolean;
    error: string | null;
}

const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
const past = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    product_id: '1',
    product: { id: '1', warehouse_id: 'wh-1', name: 'iPhone 15 Pro Max 256GB', description: 'Titanyum kasa, A17 Pro çip ve 5X optik zoom kamerayla yeni nesil akıllı telefon.', original_price: 74999, stock: 45, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 45,
    discount_percentage: 25,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-2',
    product_id: '2',
    product: { id: '2', warehouse_id: 'wh-2', name: 'Apple AirPods Pro 2. Nesil', description: 'Gelişmiş aktif gürültü engelleme ve şeffaf mod ile eşsiz ses deneyimi.', original_price: 8499, stock: 120, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 120,
    discount_percentage: 30,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-3',
    product_id: '3',
    product: { id: '3', warehouse_id: 'wh-3', name: 'MacBook Air M3 16GB / 512GB', description: 'M3 işlemcili ultra ince, sessiz ve 18 saate varan pil ömürlü dizüstü bilgisayar.', original_price: 54999, stock: 18, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 18,
    discount_percentage: 20,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-4',
    product_id: '4',
    product: { id: '4', warehouse_id: 'wh-1', name: 'Sony PlayStation 5 Slim 1TB', description: 'Ultra yüksek hızlı SSD ve DualSense kablosuz kontrol cihazı ile 4K oyun keyfi.', original_price: 21999, stock: 30, image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 30,
    discount_percentage: 15,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-5',
    product_id: '5',
    product: { id: '5', warehouse_id: 'wh-4', name: 'Samsung Galaxy S24 Ultra 512GB', description: 'Entegre S Pen, 200MP kamera ve Galaxy AI yapay zeka özellikleri.', original_price: 69999, stock: 25, image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 25,
    discount_percentage: 22,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-6',
    product_id: '6',
    product: { id: '6', warehouse_id: 'wh-1', name: 'Apple Watch Ultra 2 Titanyum', description: 'Safir ön kristal, 100m su geçirmezlik ve 3000 nit ekran parlaklığı.', original_price: 36999, stock: 40, image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 40,
    discount_percentage: 18,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-7',
    product_id: '7',
    product: { id: '7', warehouse_id: 'wh-2', name: 'Dell UltraSharp 32" 4K Monitör', description: 'IPS Black teknolojisi, Thunderbolt 4 bağlantı ve %98 DCI-P3 renk kalitesi.', original_price: 28500, stock: 15, image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 15,
    discount_percentage: 25,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-8',
    product_id: '8',
    product: { id: '8', warehouse_id: 'wh-3', name: 'JBL Boombox 3 Bluetooth Hoparlör', description: 'Derin baslar, IP67 su ve toz geçirmezlik ve 24 saat kesintisiz çalma süresi.', original_price: 16999, stock: 55, image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 55,
    discount_percentage: 35,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-9',
    product_id: '9',
    product: { id: '9', warehouse_id: 'wh-4', name: 'Sony Alpha A7 IV Kamera Body', description: '33MP tam kare sensör, 4K 60p video kaydı ve 759 odak noktalı oto-odaklama.', original_price: 89999, stock: 10, image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 10,
    discount_percentage: 12,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  },
  {
    id: 'camp-10',
    product_id: '10',
    product: { id: '10', warehouse_id: 'wh-1', name: 'DJI Mini 4 Pro Fly More Drone', description: '4K/60fps HDR video, engel algılama ve 34 dakika uçuş süresine sahip drone.', original_price: 42999, stock: 22, image_url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80' },
    campaign_stock: 22,
    discount_percentage: 20,
    start_time: past,
    end_time: tomorrow,
    is_active: true
  }
];

const initialState: CampaignState = {
    campaigns: DEFAULT_CAMPAIGNS,
    loading: false,
    error: null,
};

const campaignSlice = createSlice({
    name: 'campaign',
    initialState,
    reducers: {
        fetchCampaignsStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchCampaignsSuccess(state, action: PayloadAction<Campaign[]>) {
            state.loading = false;
            if (action.payload && action.payload.length > 0) {
                state.campaigns = action.payload;
            }
        },
        fetchCampaignsFailure(state, action: PayloadAction<string>) {
            state.loading = false;
            state.error = action.payload;
        },
        addCampaign(state, action: PayloadAction<Campaign>) {
            const exists = state.campaigns.some(c => c.id === action.payload.id || c.product_id === action.payload.product_id);
            if (!exists) {
                state.campaigns.unshift(action.payload);
            } else {
                state.campaigns = state.campaigns.map(c => (c.id === action.payload.id || c.product_id === action.payload.product_id) ? action.payload : c);
            }
        },
        updateStock(state, action: PayloadAction<{ campaignId: string; newStock: number }>) {
            const campaign = state.campaigns.find(c => c.id === action.payload.campaignId);
            if (campaign) {
                campaign.campaign_stock = action.payload.newStock;
                if (campaign.product) {
                    campaign.product.stock = action.payload.newStock;
                }
            }
        }
    },
});

export const { fetchCampaignsStart, fetchCampaignsSuccess, fetchCampaignsFailure, addCampaign, updateStock } = campaignSlice.actions;
export default campaignSlice.reducer;
