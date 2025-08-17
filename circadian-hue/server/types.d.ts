declare module 'express' {
  export type Request = any;
  export type Response = any;
  export type NextFunction = any;
  export type RequestHandler = any;
  export function Router(): any;
  const e: any;
  export default e;
}
declare module 'cors';
declare module 'helmet';
declare module 'ws' {
  export const WebSocketServer: any;
}
declare module 'zod' {
  export const z: any;
  export class ZodError extends Error {}
}
declare module 'suncalc';
