import { Client } from 'linkedin-private-api';

/**
 * LinkedInClientManager
 * Manages LinkedIn API client instances with singleton pattern per credentials.
 * Handles login and client lifecycle.
 */
export class LinkedInClientManager {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  /**
   * Get or create the LinkedIn API client
   * Automatically logs in on first access
   */
  async getClient(): Promise<any> {
    if (!this.client) {
      this.client = new Client();
      try {
        await (this.client as any).login.userPass({
          username: this.username,
          password: this.password
        });
        this.isConnected = true;
      } catch (err) {
        this.client = null;
        this.isConnected = false;
        throw new Error(`LinkedIn login failed: ${(err as Error).message}`);
      }
    }
    return this.client;
  }

  /**
   * Check if client is connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Reset the client (useful for re-authentication)
   */
  resetClient(): void {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Get all conversations
   */
  async getConversations() {
    const client = await this.getClient();
    return (client as any).message.getConversations();
  }

  /**
   * Get messages from a conversation
   */
  async getMessages(conversationId: string) {
    const client = await this.getClient();
    return (client as any).message.getMessages({ conversationId });
  }

  /**
   * Send a message
   */
  async sendMessage(options: {
    conversationId?: string;
    profileId?: string;
    text: string;
  }) {
    const client = await this.getClient();
    return (client as any).message.sendMessage(options);
  }
}
