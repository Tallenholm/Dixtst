import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, real, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roles: jsonb("roles").$type<string[]>().default(sql`'[]'::jsonb`),
  householdId: varchar("household_id").references(() => households.id),
  sunriseOffset: integer("sunrise_offset").default(0),
});

export const roomPermissions = pgTable(
  "room_permissions",
  {
    userId: varchar("user_id").references(() => users.id),
    roomId: varchar("room_id").notNull(),
    canToggle: boolean("can_toggle").default(false),
    canSchedule: boolean("can_schedule").default(false),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roomId] }),
  })
);

export const bridges = pgTable("bridges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ip: text("ip").notNull(),
  username: text("username").notNull(),
  apiVersion: text("api_version"),
  householdId: varchar("household_id").references(() => households.id).notNull(),
  isConnected: boolean("is_connected").default(false),
  lastSeen: timestamp("last_seen"),
});

export const lights = pgTable("lights", {
  id: varchar("id").primaryKey(),
  bridgeId: varchar("bridge_id").references(() => bridges.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  modelId: text("model_id"),
  isOn: boolean("is_on").default(false),
  brightness: integer("brightness").default(254),
  colorTemp: integer("color_temp").default(366),
  hue: integer("hue"),
  saturation: integer("saturation"),
  isCircadianControlled: boolean("is_circadian_controlled").default(true),
  manualOverride: boolean("manual_override").default(false),
  manualOverrideUntil: timestamp("manual_override_until"),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  sunriseOffset: integer("sunrise_offset").default(0), // minutes
  sunsetOffset: integer("sunset_offset").default(0), // minutes
  phases: jsonb("phases").$type<{
    sunrise: { start: string; end: string; brightness: number; colorTemp: number };
    day: { start: string; end: string; brightness: number; colorTemp: number };
    evening: { start: string; end: string; brightness: number; colorTemp: number };
    night: { start: string; end: string; brightness: number; colorTemp: number };
  }>(),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timezone: text("timezone").notNull(),
  isActive: boolean("is_active").default(true),
});

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  userId: varchar("user_id").references(() => users.id),
  roles: jsonb("roles").$type<string[]>(),
  householdId: varchar("household_id").references(() => households.id),
  tokenHash: text("token_hash").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usageEvents = pgTable("usage_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertBridgeSchema = createInsertSchema(bridges).pick({
  name: true,
  ip: true,
  username: true,
  apiVersion: true,
  householdId: true,
});

export const insertLightSchema = createInsertSchema(lights).pick({
  id: true,
  bridgeId: true,
  name: true,
  type: true,
  modelId: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  name: true,
  sunriseOffset: true,
  sunsetOffset: true,
  phases: true,
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  city: true,
  country: true,
  latitude: true,
  longitude: true,
  timezone: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).pick({
  key: true,
  value: true,
});

export const insertUsageEventSchema = createInsertSchema(usageEvents).pick({
  eventType: true,
  details: true,
});

export const insertHouseholdSchema = createInsertSchema(households).pick({
  name: true,
});

export const insertRoomPermissionSchema = createInsertSchema(roomPermissions).pick({
  userId: true,
  roomId: true,
  canToggle: true,
  canSchedule: true,
});
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type Household = typeof households.$inferSelect;
export type InsertBridge = z.infer<typeof insertBridgeSchema>;
export type Bridge = typeof bridges.$inferSelect;
export type InsertLight = z.infer<typeof insertLightSchema>;
export type Light = typeof lights.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type InsertRoomPermission = z.infer<typeof insertRoomPermissionSchema>;
export type RoomPermission = typeof roomPermissions.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;

// System status shape
export interface SystemStatus {
  engine: boolean;
  updates: boolean;
  schedule: boolean;
  lastUpdate: string;
}

// WebSocket message types
export type WSMessage =
  | { type: 'light_update'; data: Light }
  | { type: 'bridge_status'; data: { connected: boolean; bridge?: Bridge } }
  | { type: 'circadian_update'; data: { phase: string; nextUpdate: string } }
  | { type: 'system_status'; data: SystemStatus };
