import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

// Use relative path to hit the Next.js rewrite /api_proxy in production to avoid Mixed Content
const SOCKET_URL = "/api_proxy";

class SocketManager {
  private sockets: Map<string, Socket> = new Map();

  getSocket(namespace: string = "/"): Socket | null {
    if (this.sockets.has(namespace)) {
      return this.sockets.get(namespace)!;
    }

    const token = useAuthStore.getState().token;
    
    // Si no hay token, no intentamos conectar (evita errores 401/Invalid Token en consola)
    if (!token) {
      return null;
    }
    
    const socket = io(namespace, {
      path: "/api_proxy/socket.io/",
      // En v3.2, enviamos el token puro en el handshake auth para compatibilidad con NestJS
      auth: { token }, 
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log(`[Socket] Connected to namespace: ${namespace}`);
    });

    socket.on("connect_error", (error: any) => {
      console.error(`[Socket] Connection error [${namespace}]:`, error);
    });

    this.sockets.set(namespace, socket);
    return socket;
  }

  disconnectAll() {
    this.sockets.forEach((s) => s.disconnect());
    this.sockets.clear();
  }
}

export const socketManager = new SocketManager();

// Specific Namespace getters
export const getKitchenSocket = () => socketManager.getSocket("/kitchen");
export const getRestaurantSocket = () => socketManager.getSocket("/restaurant");
export const getGeneralSocket = () => socketManager.getSocket("/");
