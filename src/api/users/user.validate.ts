import { r, combineRoutes } from '@marblejs/core';
import { map, switchMap } from 'rxjs/operators';
import { UserDao } from './users.dao'
import { authorize$ } from './authorize.middleware';


const getUserById$ = r.pipe(
    r.matchPath('/user/:id'),
    r.matchType('GET'),
    r.useEffect(
        req$ => req$.pipe(
            map(req => req.params as { id: string }),
            map(params => params.id),
            switchMap(UserDao.findById),
            map(response => ({ body: { data: response } }))
        )
    )
)








export const userValidate$ = combineRoutes(
    '/validate',
    {
        effects: [getUserById$],
        middlewares: [authorize$]
    }
)