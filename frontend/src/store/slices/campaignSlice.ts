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

const initialState: CampaignState = {
    campaigns: [],
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
            state.campaigns = action.payload;
        },
        fetchCampaignsFailure(state, action: PayloadAction<string>) {
            state.loading = false;
            state.error = action.payload;
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

export const { fetchCampaignsStart, fetchCampaignsSuccess, fetchCampaignsFailure, updateStock } = campaignSlice.actions;
export default campaignSlice.reducer;
