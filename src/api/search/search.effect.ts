import { r, combineRoutes } from '@marblejs/core';
import { map, switchMapTo } from 'rxjs/operators';
import { merge } from 'rxjs'
import { loadGoData$, loadTazacra$ } from '../../scrapper'


let searchMegable$ = merge(loadGoData$, loadTazacra$);

const searchAll$ = r.pipe(
    r.matchPath('/all'),
    r.matchType('GET'),
    r.useEffect(
        req$ => req$.pipe(
            switchMapTo(searchMegable$ as any),
            map(response => ({ body: { data: response } }))
        )
    )
)


// const getSocketConnections$ = r.pipe(
//     r.matchPath('/socket'),
//     r.matchType('GET'),
//     r.useEffect(
//         req$ => req$.pipe(
//             map(data => sockets.clients),
//             map(response => ({ body: { data: response } }))
//         )
//     )
// )







export const search$ = combineRoutes(
    '/search',
    {
        effects: [searchAll$],
        middlewares: []
    }
)