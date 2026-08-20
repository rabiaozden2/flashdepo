import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchCampaignsStart, fetchCampaignsSuccess, fetchCampaignsFailure, Campaign } from '../slices/campaignSlice';

function* fetchCampaignsSaga(): Generator<any, void, any> {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';
        const response = yield call(fetch, `${API_URL}/api/campaigns`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = yield call([response, response.json]);
        yield put(fetchCampaignsSuccess(data.data as Campaign[]));
    } catch (error: any) {
        yield put(fetchCampaignsFailure(error.message));
    }
}

export function* watchCampaignSagas() {
    yield takeLatest(fetchCampaignsStart.type, fetchCampaignsSaga);
}
