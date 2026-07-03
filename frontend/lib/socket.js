import { io } from 'socket.io-client';
import parser from 'socket.io-msgpack-parser';

let socket;

export const initSocket = () => {
  if (!socket) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    socket = io(backendUrl, {
      path: '/api/socket_io',
      addTrailingSlash: false,
      parser,
      autoConnect: true,
      reconnection: true,
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) return initSocket();
  return socket;
};
