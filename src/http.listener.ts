import { httpListener } from '@marblejs/core'
import { bodyParser$ } from '@marblejs/middleware-body'
import { logger$ } from '@marblejs/middleware-logger'
import { cors$ } from '@marblejs/middleware-cors'
import { user$ } from './api/users/user.effect'
import { search$ } from './api/search/search.effect'
import { userValidate$ } from './api/users/user.validate';


let middlewares = [
    cors$(),
    logger$(),
    bodyParser$(),
];


let effects = [
    user$,
    search$,
    userValidate$
];


export default httpListener({
    middlewares,
    effects
})
