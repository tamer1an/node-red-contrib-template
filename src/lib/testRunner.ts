import { LinkedInClientManager } from './linkedinClient';

/**
 * TestRunner
 * Provides a standalone testing harness for LinkedIn nodes without Node-RED
 * Simulates Node-RED node behavior for local testing
 */
export class TestRunner {
  private clientManager: LinkedInClientManager;
  private lastEventTime: number;
  private testResults: any[] = [];

  constructor(username: string, password: string) {
    this.clientManager = new LinkedInClientManager(username, password);
    this.lastEventTime = Date.now();
  }

  /**
   * Test credentials by attempting login
   */
  async testCredentials(): Promise<{ success: boolean; message: string }> {
    try {
      await this.clientManager.getClient();
      return {
        success: true,
        message: 'LinkedIn credentials are valid and connection successful'
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to connect: ${(err as Error).message}`
      };
    }
  }

  /**
   * Test message-in functionality (polling for new messages)
   */
  async testMessageIn(limit: number = 5): Promise<any> {
    try {
      const result = {
        success: true,
        conversationsCount: 0,
        messagesCount: 0,
        messages: [] as any[]
      };

      const conversations = await this.clientManager.getConversations();
      const elements = (conversations as any).elements || [];
      if (!elements || elements.length === 0) {
        return { ...result, message: 'No conversations found' };
      }

      result.conversationsCount = elements.length;
      let messageCount = 0;

      for (const conv of elements.slice(0, limit)) {
        try {
          const conversationId = conv.entityUrn.split(':').pop();
          const events = await this.clientManager.getMessages(conversationId);
          const eventElements = (events as any).elements || [];

          if (!eventElements || eventElements.length === 0) continue;

          for (const msg of eventElements) {
            if (msg.eventContent && msg.eventContent.messageEvent) {
              const text =
                (msg.eventContent.messageEvent.customContent &&
                  msg.eventContent.messageEvent.customContent.text) ||
                (msg.eventContent.messageEvent.attributedBody &&
                  msg.eventContent.messageEvent.attributedBody.text);

              if (text) {
                result.messages.push({
                  conversationId,
                  sender: msg.sender,
                  text,
                  createdAt: msg.createdAt
                });
                messageCount++;
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching messages from conversation: ${(err as Error).message}`);
        }
      }

      result.messagesCount = messageCount;
      return result;
    } catch (err) {
      return {
        success: false,
        error: `Message-in test failed: ${(err as Error).message}`
      };
    }
  }

  /**
   * Test message-out functionality (sending a message)
   */
  async testMessageOut(options: {
    conversationId?: string;
    profileId?: string;
    text: string;
  }): Promise<any> {
    try {
      if (!options.conversationId && !options.profileId) {
        return {
          success: false,
          error: 'Either conversationId or profileId must be provided'
        };
      }

      await this.clientManager.sendMessage(options);

      return {
        success: true,
        message: `Message sent successfully to ${options.conversationId || options.profileId}`,
        sentTo: options.conversationId || options.profileId,
        text: options.text
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to send message: ${(err as Error).message}`
      };
    }
  }

  /**
   * Test get-messages functionality
   */
  async testGetMessages(conversationId?: string): Promise<any> {
    try {
      if (conversationId) {
        const messages = await this.clientManager.getMessages(conversationId);
        const messageElements = (messages as any).elements || [];
        return {
          success: true,
          messageCount: messageElements.length,
          messages: messageElements
        };
      } else {
        const conversations = await this.clientManager.getConversations();
        const convElements = (conversations as any).elements || [];
        return {
          success: true,
          conversationCount: convElements.length,
          conversations: convElements
        };
      }
    } catch (err) {
      return {
        success: false,
        error: `Failed to get messages: ${(err as Error).message}`
      };
    }
  }

  /**
   * Reset the client (useful for cleanup)
   */
  resetClient(): void {
    this.clientManager.resetClient();
  }

  /**
   * Get test results
   */
  getResults(): any[] {
    return this.testResults;
  }

  /**
   * Add result to log
   */
  addResult(testName: string, result: any): void {
    this.testResults.push({
      test: testName,
      timestamp: new Date().toISOString(),
      result
    });
  }
}

