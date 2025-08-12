export interface Bridge {
  id: string;
  ip: string;
  name: string;
  isConnected: boolean;
  username?: string;
  apiVersion?: string;
  lastSeen?: string;
}
