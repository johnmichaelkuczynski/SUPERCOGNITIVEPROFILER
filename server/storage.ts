import { users, documents, type User, type InsertUser, type Document, type InsertDocument } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<string, Document>;
  private userId: number;
  private documentId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.userId = 1;
    this.documentId = 1;
    
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
    const document: Document = { ...insertDocument, id };
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
}

// Switch to database storage
export const storage = new DatabaseStorage();
