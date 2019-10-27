import { genSaltSync, hash, compare } from 'bcryptjs';
import { Observable, defer } from 'rxjs';


export function hashPassowrd(password: string): Observable<string> {
    let slat = genSaltSync(10);
    return defer(() => hash(password, slat));
}

export function verifyPassword(sentPassword: string, hashedPassword: string) {
    return defer(
        () => compare(sentPassword, hashedPassword)
    );
}
