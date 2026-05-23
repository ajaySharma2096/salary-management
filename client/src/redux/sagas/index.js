import { all } from 'redux-saga/effects';
import { authSaga } from './authSaga';
import { employeeSaga } from './employeeSaga';
import { analyticsSaga } from './analyticsSaga';

export default function* rootSaga() {
  yield all([authSaga(), employeeSaga(), analyticsSaga()]);
}
