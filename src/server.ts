import { createServer, bindTo, HttpServerEffect, matchEvent, ServerEvent } from '@marblejs/core';
import httpListener from './http.listener';
import { connect } from 'mongoose';
import { defer, Observable, merge } from 'rxjs';
import { WebSocketServerToken } from './api/websocket/tokens';
import webSocketListener from './api/websocket/websocket.listener';
import { tap, map } from 'rxjs/operators';
import { MarbleWebSocketServer } from '@marblejs/websockets';


// const handleWsServerConnectionEvents = (wsServer: MarbleWebSocketServer) => {
//     wsServer.on('connection', conn => {
//         let message = {
//             type: 'WELCOME_MESSAGE',
//             payload: {
//                 message: 'Hello to our server'
//             }
//         }

//         conn.send(JSON.stringify(message));
//     });
// };



const listening$: HttpServerEffect = (event$, server, { ask }) =>
    event$.pipe(
        matchEvent(ServerEvent.listening),
        map(event => event.payload),
        tap(({ port, host }) => console.log(`Running @ http://${host}:${port}/`)),
    );

export const server = createServer({
    port: 3000,
    hostname: 'localhost',
    httpListener,
    dependencies: [
        bindTo(WebSocketServerToken)(webSocketListener({ port: 8080 }).run)
    ],
    event$: (...args) => merge(
        listening$(...args)
    )
})


server.run();





connectDB()
    .subscribe(_ => {
        console.log('[Database Connected]')
    })


function connectDB(): Observable<any> {
    return defer(() =>
        connect('mongodb://localhost:27017/marbeljs', { useNewUrlParser: true })
    )
}
