import { Client } from 'linkedin-private-api';
export declare class LinkedInClientManager {
    private client;
    private isConnected;
    private username;
    private password;
    constructor(username: string, password: string);
    getClient(): Promise<Client>;
    getIsConnected(): boolean;
    resetClient(): void;
    getConversations(): Promise<any>;
    getMessages(conversationId: string): Promise<import("linkedin-private-api/dist/src/scrollers").MessageScroller>;
    sendMessage(options: {
        conversationId?: string;
        profileId?: string;
        text: string;
    }): Promise<import("linkedin-private-api").MessageEventCreateResponse>;
}
//# sourceMappingURL=linkedinClient.d.ts.map