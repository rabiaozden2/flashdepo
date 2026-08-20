import { all } from 'redux-saga/effects';
import { watchCampaignSagas } from './sagas/campaignSaga';
import { watchAuthSagas } from './sagas/authSaga';

export default function* rootSaga() {
    yield all([
        watchCampaignSagas(),
        watchAuthSagas(),
    ]);
}
