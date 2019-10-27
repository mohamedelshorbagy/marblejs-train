import { r, combineRoutes, HttpError, HttpStatus } from '@marblejs/core';
import { map, switchMap, catchError } from 'rxjs/operators';
import { UserDao } from './users.dao'
import { generateUserToken } from '../../token';
import { generateToken } from '@marblejs/middleware-jwt';
import { config } from '../../config'
import { authorize$ } from './authorize.middleware';
import { requestValidator$, t } from '@marblejs/middleware-io'
import { throwError, of } from 'rxjs';
import { neverNullable } from './authorize.middleware'
import { hashPassowrd, verifyPassword } from '../../encrypt';

const userSchema = t.type({
    name: t.string,
    age: t.union([t.number, t.string]),
});




const createUser$ = r.pipe(
    r.matchPath('/create'),
    r.matchType('POST'),
    r.use(requestValidator$({ body: userSchema })),
    r.useEffect(
        req$ => req$.pipe(
            map(req => req.body),
            switchMap(UserDao.create),
            map((user) => ({ generatedToken: generateUserToken(user), user })),
            map((data) =>
                ({ token: generateToken({ secret: config.SECRET_KEY })(data.generatedToken), user: data.user })
            ),
            map(response => ({ body: { data: { ...response } } }))
        )
    )
)


const getUserById$ = r.pipe(
    r.matchPath('/:id'),
    r.matchType('GET'),
    r.useEffect(
        req$ => req$.pipe(
            map(req => (<any>req.params).id),
            switchMap(UserDao.findById),
            map(response => ({ body: { data: response } }))
        )
    )
)



const getAllUsers$ = r.pipe(
    r.matchPath('/all'),
    r.matchType('GET'),
    r.use(authorize$),
    r.useEffect(
        req$ => req$.pipe(
            switchMap(UserDao.findAll),
            map(response => ({ body: { data: response } }))
        )
    )
)



const login$ = r.pipe(
    r.matchPath('/createForEncrypt'),
    r.matchType('POST'),
    r.useEffect(
        req$ => req$.pipe(
            switchMap(req => of(req).pipe(
                map(req => req.body as { email: string, password: string }),
                switchMap(UserDao.findByEmail),
                switchMap(neverNullable('Email Already Exists')),
                // map(user => { console.log(user); return (<any>user)!.password }),
                // switchMap(password => verifyPassword(password)),
                map(response => ({ body: { data: response, req: req.body } })),
                )
            ))
    )
)








export const user$ = combineRoutes(
    '/users',
    [createUser$, getAllUsers$, getUserById$, login$]
)