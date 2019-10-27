import { defer, of, throwError } from 'rxjs'
import { UserModel } from './user.model'
import { catchError } from 'rxjs/operators';
import { HttpError, HttpStatus } from '@marblejs/core';

export namespace UserDao {

    export const findAll = () => {
        return defer(() => UserModel.find({}));
    }

    export const findById = (id: string) => {
        return defer(() => UserModel.findById(id));
    }


    export const create = (user: any) => {
        return defer(() => UserModel.findOneAndUpdate({ name: user.name }, user, { upsert: true, new: true, setDefaultsOnInsert: true }));
    }


    export const createByEmailAndPassword = ({ email }: any) => {
        // return defer(() => UserModel.)
    }

    export const findByEmail = ({ email }: any) => {
        return defer(() => UserModel.findOne({ email })).pipe(
            catchError((e) => {
                console.log(e);
                return throwError(
                    new HttpError(e, HttpStatus.CONFLICT)
                )
            }
            )
        )
    }

}