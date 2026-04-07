import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants';

let socketInstance = null;

function getSocketBaseUrl() {
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

export function getSocket(token = null) {
  if (socketInstance) {
    if (token && socketInstance.auth?.token !== token) {
      socketInstance.auth = { token };
      socketInstance.connect();
    }
    return socketInstance;
  }

  socketInstance = io(getSocketBaseUrl(), {
    autoConnect: false,
    transports: ['websocket'],
    auth: token ? { token } : {}
  });

  socketInstance.connect();
  return socketInstance;
}

export function disconnectSocket() {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
}
