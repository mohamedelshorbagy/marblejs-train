import { config } from '../../config'
import { authorize$ as jwt$ } from '@marblejs/middleware-jwt'
import { UserDao } from './users.dao';
import { flatMap, tap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';


const jwtConfig = { secret: config.SECRET_KEY };

export const isNullable = (data: any) =>
    data === null || data === undefined;

export const neverNullable = (message: string = 'something went wrong') => <T>(data: T) => isNullable(data)
    ? throwError(new Error(message))
    : of(data);


const validate$ = (payload) => {
    console.log(payload);
    return UserDao.findById(payload.id)
        .pipe(
            flatMap(neverNullable())
        )
}

export const authorize$ = jwt$(jwtConfig, validate$);