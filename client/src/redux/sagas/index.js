import { all } from 'redux-saga/effects';
import { authSaga } from './authSaga';
import { employeeSaga } from './employeeSaga';

export default function* rootSaga() {
  yield all([authSaga(), employeeSaga()]);
}
