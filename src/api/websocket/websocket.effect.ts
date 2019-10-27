import { matchEvent } from '@marblejs/core';
import { WsEffect } from '@marblejs/websockets';
import { map, switchMapTo, concatMapTo } from 'rxjs/operators';
import { merge, concat, of } from 'rxjs';
import { loadGoData$, loadTazacra$, loadOtbeesy$ } from '../../scrapper';
import { completeOperator } from './complete.operator';

let searchMegable$ = merge(loadGoData$, loadTazacra$, loadOtbeesy$)
    .pipe(
        map(res => {
            let result = {};
            Object.keys(res).forEach((key) => {
                result[key] = (res[key] as any[]).sort((a, b) => a.price - b.price);
            });
            return result;
        }),
        map(res => ({ payload: res, type: 'RESULT' })),
        completeOperator()
    )

export const search$: WsEffect = (event$, ...args) =>
    event$.pipe(
        matchEvent('SEARCH'),
        concatMapTo(searchMegable$),
        map(payload => payload)
    );


