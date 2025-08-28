export interface Bridge {
  id: string;
  householdId?: string;
  ip: string;
  name: string;
  isConnected: boolean;
  username?: string;
  apiVersion?: string;
  lastSeen?: string;
}
