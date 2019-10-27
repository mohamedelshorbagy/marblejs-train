import { Observable, concat, of } from "rxjs";

export function completeOperator(type: string = 'COMPLETE') {
    return (source: Observable<any>) => {
        let completeObservable: Observable<{ type: string }> = of({ type });
        return concat(source, completeObservable);
    }
}