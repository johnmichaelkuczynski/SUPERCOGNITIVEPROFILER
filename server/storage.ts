import { 
  users, documents, conversations, messages, rewrites, profiles,
  type User, type InsertUser, 
  type Document, type InsertDocument,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Rewrite, type InsertRewrite,
  type Profile, type InsertProfile
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByUserId(userId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message | undefined>;
  
  // Rewrite methods
  getRewrite(id: number): Promise<Rewrite | undefined>;
  getRewritesByUserId(userId: number): Promise<Rewrite[]>;
  createRewrite(rewrite: InsertRewrite): Promise<Rewrite>;
  deleteRewrite(id: number): Promise<boolean>;
  
  // Profile methods
  getProfile(id: number): Promise<Profile | undefined>;
  getProfilesByUserId(userId: number): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  deleteProfile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<string, Document>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private rewrites: Map<number, Rewrite>;
  private profiles: Map<number, Profile>;
  private userId: number;
  private documentId: number;
  private conversationId: number;
  private messageId: number;
  private rewriteId: number;
  private profileId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.rewrites = new Map();
    this.profiles = new Map();
    this.userId = 1;
    this.documentId = 1;
    this.conversationId = 1;
    this.messageId = 1;
    this.rewriteId = 1;
    this.profileId = 1;
    
    // Add a default user for testing
    this.createUser({
      username: 'user@example.com',
      password: 'password123',
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.userId === userId,
    );
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = `doc_${this.documentId++}`;
    const document: Document = { 
      ...insertDocument, 
      id,
      metadata: insertDocument.metadata || null 
    };
    this.documents.set(id, document);
    return document;
  }
  
  async updateDocument(id: string, documentUpdate: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...documentUpdate };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }
  
  // Conversation Methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conversation) => conversation.userId === userId,
    );
  }
  
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationId++;
    const conversation: Conversation = { 
      ...insertConversation, 
      id,
      model: insertConversation.model || null,
      metadata: insertConversation.metadata || null,
      contextDocumentIds: insertConversation.contextDocumentIds || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async updateConversation(id: number, conversationUpdate: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      return undefined;
    }
    
    const updatedConversation: Conversation = {
      ...conversation,
      ...conversationUpdate,
      updatedAt: new Date()
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }
  
  async deleteConversation(id: number): Promise<boolean> {
    const exists = this.conversations.has(id);
    if (exists) {
      this.conversations.delete(id);
      
      // Delete all messages associated with this conversation
      for (const [messageId, message] of this.messages.entries()) {
        if (message.conversationId === id) {
          this.messages.delete(messageId);
        }
      }
    }
    return exists;
  }
  
  // Message Methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return timeA - timeB;
      });
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const message: Message = {
      ...insertMessage,
      id,
      metadata: insertMessage.metadata || null,
      documentReferences: insertMessage.documentReferences || null,
      timestamp: new Date()
    };
    this.messages.set(id, message);
    
    // Also update the conversation's updatedAt timestamp
    if (this.conversations.has(insertMessage.conversationId)) {
      const conversation = this.conversations.get(insertMessage.conversationId)!;
      this.conversations.set(insertMessage.conversationId, {
        ...conversation,
        updatedAt: new Date()
      });
    }
    
    return message;
  }
  
  async updateMessage(id: number, messageUpdate: Partial<Message>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) {
      return undefined;
    }
    
    const updatedMessage: Message = {
      ...message,
      ...messageUpdate
    };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Rewrite methods implementation
  async getRewrite(id: number): Promise<Rewrite | undefined> {
    return this.rewrites.get(id);
  }

  async getRewritesByUserId(userId: number): Promise<Rewrite[]> {
    return Array.from(this.rewrites.values()).filter(rewrite => rewrite.userId === userId);
  }

  async createRewrite(insertRewrite: InsertRewrite): Promise<Rewrite> {
    const id = this.rewriteId++;
    const rewrite: Rewrite = {
      ...insertRewrite,
      id,
      metadata: insertRewrite.metadata || null,
      instructions: insertRewrite.instructions || null,
      sourceType: insertRewrite.sourceType || null,
      sourceId: insertRewrite.sourceId || null,
      createdAt: new Date()
    };
    this.rewrites.set(id, rewrite);
    return rewrite;
  }

  async deleteRewrite(id: number): Promise<boolean> {
    return this.rewrites.delete(id);
  }

  // Profile methods implementation
  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async getProfilesByUserId(userId: number): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter(profile => profile.userId === userId);
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = this.profileId++;
    const profile: Profile = {
      ...insertProfile,
      id,
      createdAt: new Date(),
      metadata: insertProfile.metadata || null,
      inputText: insertProfile.inputText || null
    };
    this.profiles.set(id, profile);
    return profile;
  }

  async deleteProfile(id: number): Promise<boolean> {
    return this.profiles.delete(id);
  }
}

import { db } from './db';
import { eq } from 'drizzle-orm';

// Implement a hybrid storage system that falls back to memory if DB operations fail
export class DatabaseStorage implements IStorage {
  private memStorage: MemStorage;
  
  constructor() {
    this.memStorage = new MemStorage();
  }
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Database error in getUser, falling back to memory storage:", error);
      return this.memStorage.getUser(id);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Database error in getUserByUsername, falling back to memory storage:", error);
      return this.memStorage.getUserByUsername(username);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      console.error("Database error in createUser, falling back to memory storage:", error);
      return this.memStorage.createUser(insertUser);
    }
  }
  
  async getDocument(id: string): Promise<Document | undefined> {
    try {
      const [document] = await db.select().from(documents).where(eq(documents.id, id));
      return document;
    } catch (error) {
      console.error("Database error in getDocument, falling back to memory storage:", error);
      return this.memStorage.getDocument(id);
    }
  }

  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    try {
      const results = await db.select().from(documents).where(eq(documents.userId, userId));
      return results;
    } catch (error) {
      console.error("Database error in getDocumentsByUserId, falling back to memory storage:", error);
      return this.memStorage.getDocumentsByUserId(userId);
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    try {
      // Generate a UUID for the document ID
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const [document] = await db
        .insert(documents)
        .values({
          ...insertDocument,
          id: docId
        })
        .returning();
      return document;
    } catch (error) {
      console.error("Database error in createDocument, falling back to memory storage:", error);
      return this.memStorage.createDocument(insertDocument);
    }
  }

  async updateDocument(id: string, documentUpdate: Partial<Document>): Promise<Document | undefined> {
    try {
      const [document] = await db
        .update(documents)
        .set({
          ...documentUpdate,
          // updatedAt field is not in the schema, so we remove it
        })
        .where(eq(documents.id, id))
        .returning();
      return document;
    } catch (error) {
      console.error("Database error in updateDocument, falling back to memory storage:", error);
      return this.memStorage.updateDocument(id, documentUpdate);
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(documents)
        .where(eq(documents.id, id));
      return !!result;
    } catch (error) {
      console.error("Database error in deleteDocument, falling back to memory storage:", error);
      return this.memStorage.deleteDocument(id);
    }
  }
  
  // Conversation Methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    try {
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
      return conversation;
    } catch (error) {
      console.error("Database error in getConversation, falling back to memory storage:", error);
      return this.memStorage.getConversation(id);
    }
  }
  
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    try {
      const result = await db.select().from(conversations).where(eq(conversations.userId, userId));
      return result;
    } catch (error) {
      console.error("Database error in getConversationsByUserId, falling back to memory storage:", error);
      return this.memStorage.getConversationsByUserId(userId);
    }
  }
  
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      const [result] = await db.insert(conversations).values(conversation).returning();
      return result;
    } catch (error) {
      console.error("Database error in createConversation, falling back to memory storage:", error);
      return this.memStorage.createConversation(conversation);
    }
  }
  
  async updateConversation(id: number, conversationUpdate: Partial<Conversation>): Promise<Conversation | undefined> {
    try {
      const [result] = await db
        .update(conversations)
        .set({ ...conversationUpdate, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Database error in updateConversation, falling back to memory storage:", error);
      return this.memStorage.updateConversation(id, conversationUpdate);
    }
  }
  
  async deleteConversation(id: number): Promise<boolean> {
    try {
      // First delete all messages in the conversation
      await db.delete(messages).where(eq(messages.conversationId, id));
      
      // Then delete the conversation
      const result = await db.delete(conversations).where(eq(conversations.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Database error in deleteConversation, falling back to memory storage:", error);
      return this.memStorage.deleteConversation(id);
    }
  }
  
  // Message Methods
  async getMessage(id: number): Promise<Message | undefined> {
    try {
      const [message] = await db.select().from(messages).where(eq(messages.id, id));
      return message;
    } catch (error) {
      console.error("Database error in getMessage, falling back to memory storage:", error);
      return this.memStorage.getMessage(id);
    }
  }
  
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.timestamp);
      return result;
    } catch (error) {
      console.error("Database error in getMessagesByConversationId, falling back to memory storage:", error);
      return this.memStorage.getMessagesByConversationId(conversationId);
    }
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const [result] = await db.insert(messages).values(message).returning();
      
      // Update the conversation's updatedAt timestamp
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, message.conversationId));
        
      return result;
    } catch (error) {
      console.error("Database error in createMessage, falling back to memory storage:", error);
      return this.memStorage.createMessage(message);
    }
  }
  
  async updateMessage(id: number, messageUpdate: Partial<Message>): Promise<Message | undefined> {
    try {
      const [result] = await db
        .update(messages)
        .set(messageUpdate)
        .where(eq(messages.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Database error in updateMessage, falling back to memory storage:", error);
      return this.memStorage.updateMessage(id, messageUpdate);
    }
  }

  // Rewrite methods implementation
  async getRewrite(id: number): Promise<Rewrite | undefined> {
    try {
      const [rewrite] = await db.select().from(rewrites).where(eq(rewrites.id, id));
      return rewrite;
    } catch (error) {
      console.error("Database error in getRewrite, falling back to memory storage:", error);
      return this.memStorage.getRewrite(id);
    }
  }

  async getRewritesByUserId(userId: number): Promise<Rewrite[]> {
    try {
      const result = await db.select().from(rewrites).where(eq(rewrites.userId, userId));
      return result;
    } catch (error) {
      console.error("Database error in getRewritesByUserId, falling back to memory storage:", error);
      return this.memStorage.getRewritesByUserId(userId);
    }
  }

  async createRewrite(rewrite: InsertRewrite): Promise<Rewrite> {
    try {
      const [result] = await db.insert(rewrites).values(rewrite).returning();
      return result;
    } catch (error) {
      console.error("Database error in createRewrite, falling back to memory storage:", error);
      return this.memStorage.createRewrite(rewrite);
    }
  }

  async deleteRewrite(id: number): Promise<boolean> {
    try {
      const result = await db.delete(rewrites).where(eq(rewrites.id, id));
      return !!result;
    } catch (error) {
      console.error("Database error in deleteRewrite, falling back to memory storage:", error);
      return this.memStorage.deleteRewrite(id);
    }
  }

  // Profile methods implementation
  async getProfile(id: number): Promise<Profile | undefined> {
    try {
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
      return profile;
    } catch (error) {
      console.error("Database error in getProfile, falling back to memory storage:", error);
      return this.memStorage.getProfile(id);
    }
  }

  async getProfilesByUserId(userId: number): Promise<Profile[]> {
    try {
      const result = await db.select().from(profiles).where(eq(profiles.userId, userId));
      return result;
    } catch (error) {
      console.error("Database error in getProfilesByUserId, falling back to memory storage:", error);
      return this.memStorage.getProfilesByUserId(userId);
    }
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    try {
      const [result] = await db.insert(profiles).values(profile).returning();
      return result;
    } catch (error) {
      console.error("Database error in createProfile, falling back to memory storage:", error);
      return this.memStorage.createProfile(profile);
    }
  }

  async deleteProfile(id: number): Promise<boolean> {
    try {
      const result = await db.delete(profiles).where(eq(profiles.id, id));
      return !!result;
    } catch (error) {
      console.error("Database error in deleteProfile, falling back to memory storage:", error);
      return this.memStorage.deleteProfile(id);
    }
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();
