import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchCampaignsStart, fetchCampaignsSuccess, fetchCampaignsFailure, Campaign } from '../slices/campaignSlice';

function* fetchCampaignsSaga(): Generator<any, void, any> {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';
        let apiCampaigns: Campaign[] = [];
        try {
            const response = yield call(fetch, `${API_URL}/api/campaigns`);
            if (response.ok) {
                const data = yield call([response, response.json]);
                if (data && data.data) apiCampaigns = data.data;
            }
        } catch (e) {}

        let customCampaigns: Campaign[] = [];
        if (typeof window !== 'undefined') {
            try {
                customCampaigns = JSON.parse(localStorage.getItem('custom_campaigns') || '[]');
            } catch (e) {}
        }

        const mergedMap = new Map<string, Campaign>();
        customCampaigns.forEach(c => mergedMap.set(c.id || c.product_id, c));
        apiCampaigns.forEach(c => {
            if (!mergedMap.has(c.id) && !mergedMap.has(c.product_id)) {
                mergedMap.set(c.id, c);
            }
        });

        const allCampaigns = Array.from(mergedMap.values());
        if (allCampaigns.length > 0) {
            yield put(fetchCampaignsSuccess(allCampaigns));
        } else {
            yield put(fetchCampaignsSuccess([]));
        }
    } catch (error: any) {
        yield put(fetchCampaignsFailure(error.message));
    }
}

export function* watchCampaignSagas() {
    yield takeLatest(fetchCampaignsStart.type, fetchCampaignsSaga);
}
