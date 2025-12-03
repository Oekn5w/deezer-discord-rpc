import { log } from './Log';
import { WSSPort } from '../variables';
import { WebSocketServer, WebSocket } from 'ws';
import { runJs } from '../functions';
import * as Config from './Config';
import * as http from 'http';
import * as ipaddr from 'ipaddr.js';

export let server: WebSocketServer | null = null;
let activityData : string = '';
let app: Electron.App = null;
let isRunning = false;
let isLocalhost = false;

export function init(app_: Electron.App) {
  app = app_;
  updateState();
}

export function updateState() {
  const configRunning = Config.get<boolean>(app, 'websocket_enabled', false);
  const configLocalhost = Config.get<boolean>(app, 'websocket_localhost_only', true);
  if (isRunning !== configRunning || isLocalhost !== configLocalhost) {
    stop();
    if (configRunning) {
      start(configLocalhost);
    }
    isRunning = configRunning;
    isLocalhost = configLocalhost;
  }
}

export function updateActivityData(dataDict) {
  activityData = dataDict;
  if (server !== null) {
    server.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(activityData);
      }
    }
    );
  }
}

function start(localhost: boolean) {
  server = new WebSocketServer({ port: WSSPort, host: (localhost ? 'localhost' : '') });
  log('Websocket Server','Running on port ' + WSSPort + (localhost ? ' allowing localhost connections only' : ' allowing all connections'));
  server.on('connection', function connection(ws:WebSocket, req : http.IncomingMessage) {
    let clientID = req.socket.remoteAddress;
    // https://stackoverflow.com/a/31514365
    if(ipaddr.IPv6.isValid(clientID)) {
      const ip = ipaddr.IPv6.parse(clientID);
      if (ip.isIPv4MappedAddress()) {
        clientID = ip.toIPv4Address().toString();
      }
    }
    clientID += ':' + req.socket.remotePort;
    log('Websocket Server','Client ' + clientID + ' connected');
    ws.on('error', console.error);
    ws.on('close', () => {
      log('Websocket Server','Client ' + clientID + ' disconnected');
    });
    ws.on('message', function message(data) {
      data = String(data);
      log('Websocket Server','Command received from client ' + clientID + ' : ' + data);
      switch(data) {
        case 'command/togglePause':
          runJs('dzPlayer.control.togglePause()');
          break;
        case 'command/prevSong':
          runJs('dzPlayer.control.prevSong()');
          break;
        case 'command/nextSong':
          runJs('dzPlayer.control.nextSong()');
          break;
        case 'command/toggleMute':
          runJs('dzPlayer.control.mute()');
          break;
        case 'command/incVolume':
          runJs('dzPlayer.control.setVolume(dzPlayer.getVolume() + 0.05)');
          break;
        case 'command/decVolume':
          runJs('dzPlayer.control.setVolume(dzPlayer.getVolume() - 0.05)');
          break;
        case 'ping':
          ws.send('pong');
          break;
        case 'getState':
        case 'getStatus':
          ws.send(activityData);
          break;
        default:
          log('Websocket Server','Unknown command: ' + data);
          break;
      }
    });
    // Send the current status after connecting
    ws.send(activityData);
  });
}

export function stop() {
  if (server != null) {
    log('Websocket Server','Stopped');
    server.close();
    server = null;
    isRunning = false;
  }
}
