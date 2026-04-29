export declare class TestRunner {
    private clientManager;
    private lastEventTime;
    private testResults;
    constructor(username: string, password: string);
    testCredentials(): Promise<{
        success: boolean;
        message: string;
    }>;
    testMessageIn(limit?: number): Promise<any>;
    testMessageOut(options: {
        conversationId?: string;
        profileId?: string;
        text: string;
    }): Promise<any>;
    testGetMessages(conversationId?: string): Promise<any>;
    resetClient(): void;
    getResults(): any[];
    addResult(testName: string, result: any): void;
}
//# sourceMappingURL=testRunner.d.ts.map