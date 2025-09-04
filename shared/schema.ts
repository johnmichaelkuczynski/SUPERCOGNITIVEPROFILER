import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  model: text("model").notNull(),
  date: timestamp("date").notNull(),
  metadata: text("metadata"), // For AI detection and other metadata (JSON formatted)
  chunks: json("chunks").default('[]'), // Array of document chunks for better analysis
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  data: text("data").notNull(), // JSON data
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  contextDocumentIds: text("context_document_ids"), // JSON array of document IDs
  model: text("model"), // Default model for this conversation
  metadata: text("metadata"), // Additional metadata (e.g., settings)
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: text("metadata"), // Additional metadata (e.g., tokens, model used)
  documentReferences: text("document_references"), // Referenced documents in this message
});

export const rewrites = pgTable("rewrites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  originalContent: text("original_content").notNull(),
  rewrittenContent: text("rewritten_content").notNull(),
  instructions: text("instructions"),
  model: text("model").notNull(),
  mode: text("mode").notNull(), // "rewrite" or "homework"
  createdAt: timestamp("created_at").defaultNow(),
  metadata: text("metadata"), // JSON metadata (chunks processed, original length, etc.)
  sourceType: text("source_type"), // "document", "chat", "direct_input"
  sourceId: text("source_id"), // Reference to source document/conversation if applicable
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  profileType: text("profile_type").notNull(), // "cognitive" or "psychological"
  analysisType: text("analysis_type").notNull(), // "instant" or "comprehensive"
  inputText: text("input_text"), // For instant analysis
  results: json("results").notNull(), // JSON profile results
  createdAt: timestamp("created_at").defaultNow(),
  metadata: text("metadata"), // Additional metadata
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents);

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertRewriteSchema = createInsertSchema(rewrites).omit({
  id: true,
  createdAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertRewrite = z.infer<typeof insertRewriteSchema>;
export type Rewrite = typeof rewrites.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// GPT Bypass schema additions
export const rewriteJobs = pgTable("rewrite_jobs", {
  id: text("id").primaryKey(),
  inputText: text("input_text").notNull(),
  styleText: text("style_text"),
  contentMixText: text("content_mix_text"),
  customInstructions: text("custom_instructions"),
  selectedPresets: json("selected_presets").$type<string[]>(),
  provider: text("provider").notNull(),
  chunks: json("chunks").$type<TextChunk[]>(),
  selectedChunkIds: json("selected_chunk_ids").$type<string[]>(),
  mixingMode: text("mixing_mode").$type<'style' | 'content' | 'both'>(),
  outputText: text("output_text"),
  inputAiScore: integer("input_ai_score"),
  outputAiScore: integer("output_ai_score"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRewriteJobSchema = createInsertSchema(rewriteJobs).omit({
  id: true,
  createdAt: true,
});

export type InsertRewriteJob = z.infer<typeof insertRewriteJobSchema>;
export type RewriteJob = typeof rewriteJobs.$inferSelect;

// Additional interfaces for GPT Bypass
export interface TextChunk {
  id: string;
  content: string;
  startWord: number;
  endWord: number;
  aiScore?: number;
}

export interface InstructionPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  instruction: string;
}

export interface WritingSample {
  id: string;
  name: string;
  preview: string;
  content: string;
  category: string;
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'perplexity';
  model?: string;
}

export interface RewriteRequest {
  inputText: string;
  styleText?: string;
  contentMixText?: string;
  customInstructions?: string;
  selectedPresets?: string[];
  provider: string;
  selectedChunkIds?: string[];
  mixingMode?: 'style' | 'content' | 'both';
}

export interface RewriteResponse {
  rewrittenText: string;
  inputAiScore: number;
  outputAiScore: number;
  jobId: string;
}
