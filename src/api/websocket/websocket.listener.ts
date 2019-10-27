import { webSocketListener } from '@marblejs/websockets'
import { search$ } from './websocket.effect';


const effects = [
    search$
];

const middlewares = [];

export default webSocketListener({ effects, middlewares });

