"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const linkedinClient_1 = require("./lib/linkedinClient");
module.exports = function (RED) {
    'use strict';
    function LinkedInCredentialsNode(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.username = n.username;
        this.password = this.credentials ? this.credentials.password : '';
        this.clientManager = new linkedinClient_1.LinkedInClientManager(this.username, this.password);
        this.getClient = async () => {
            return this.clientManager.getClient();
        };
    }
    RED.nodes.registerType('linkedin-credentials', LinkedInCredentialsNode, {
        credentials: {
            password: { type: 'password' }
        }
    });
    function LinkedInMessageIn(n) {
        RED.nodes.createNode(this, n);
        this.creds = RED.nodes.getNode(n.creds);
        const pollInterval = parseInt(n.pollInterval) || 10;
        let lastEventTime = Date.now();
        let pollTimer = null;
        if (this.creds) {
            this.status({ fill: 'yellow', shape: 'dot', text: 'connecting...' });
            const startPolling = async () => {
                try {
                    const client = await this.creds.getClient();
                    this.status({ fill: 'green', shape: 'dot', text: 'connected' });
                    pollTimer = setInterval(async () => {
                        try {
                            const conversations = await client.message.getConversations();
                            if (!conversations || !conversations.elements)
                                return;
                            for (const conv of conversations.elements) {
                                const events = await client.message.getMessages({ conversationId: conv.entityUrn.split(':').pop() });
                                if (!events || !events.elements)
                                    continue;
                                for (const msg of events.elements) {
                                    const eventTime = new Date(msg.createdAt).getTime();
                                    if (eventTime > lastEventTime && msg.eventContent && msg.eventContent.messageEvent) {
                                        const text = (msg.eventContent.messageEvent.customContent && msg.eventContent.messageEvent.customContent.text) || (msg.eventContent.messageEvent.attributedBody && msg.eventContent.messageEvent.attributedBody.text);
                                        if (text) {
                                            this.send({
                                                payload: text,
                                                conversationId: conv.entityUrn.split(':').pop(),
                                                sender: msg.sender
                                            });
                                        }
                                        lastEventTime = Math.max(lastEventTime, eventTime);
                                    }
                                }
                            }
                        }
                        catch (err) {
                            this.error("Error polling messages: " + err.message);
                        }
                    }, pollInterval * 1000);
                }
                catch (err) {
                    this.status({ fill: 'red', shape: 'ring', text: 'login failed' });
                    this.error("Login failed: " + err.message);
                }
            };
            startPolling();
            this.on('close', (done) => {
                if (pollTimer)
                    clearInterval(pollTimer);
                done();
            });
        }
        else {
            this.status({ fill: 'red', shape: 'ring', text: 'no credentials' });
        }
    }
    RED.nodes.registerType('linkedin-message-in', LinkedInMessageIn);
    function LinkedInMessageOut(n) {
        RED.nodes.createNode(this, n);
        this.creds = RED.nodes.getNode(n.creds);
        if (this.creds) {
            this.status({ fill: 'green', shape: 'dot', text: 'ready' });
            this.on('input', async (msg, send, done) => {
                try {
                    const client = await this.creds.getClient();
                    if (msg.conversationId) {
                        await client.message.sendMessage({
                            conversationId: msg.conversationId,
                            text: msg.payload
                        });
                        this.status({ fill: 'blue', shape: 'dot', text: 'sent' });
                        send(msg);
                    }
                    else if (msg.profileId) {
                        await client.message.sendMessage({
                            profileId: msg.profileId,
                            text: msg.payload
                        });
                        this.status({ fill: 'blue', shape: 'dot', text: 'sent' });
                        send(msg);
                    }
                    else {
                        this.error("Missing msg.conversationId or msg.profileId", msg);
                        this.status({ fill: 'red', shape: 'ring', text: 'error' });
                    }
                }
                catch (err) {
                    this.error("Failed to send message: " + err.message, msg);
                    this.status({ fill: 'red', shape: 'ring', text: 'error' });
                }
                if (done)
                    done();
            });
        }
        else {
            this.status({ fill: 'red', shape: 'ring', text: 'no credentials' });
        }
    }
    RED.nodes.registerType('linkedin-message-out', LinkedInMessageOut);
    function LinkedInGetMessages(n) {
        RED.nodes.createNode(this, n);
        this.creds = RED.nodes.getNode(n.creds);
        if (this.creds) {
            this.status({ fill: 'green', shape: 'dot', text: 'ready' });
            this.on('input', async (msg, send, done) => {
                try {
                    const client = await this.creds.getClient();
                    if (msg.conversationId) {
                        const events = await client.message.getMessages({ conversationId: msg.conversationId });
                        msg.payload = events.elements || [];
                        send(msg);
                        this.status({ fill: 'blue', shape: 'dot', text: 'fetched' });
                    }
                    else {
                        const convs = await client.message.getConversations();
                        msg.payload = convs.elements || [];
                        send(msg);
                        this.status({ fill: 'blue', shape: 'dot', text: 'fetched' });
                    }
                }
                catch (err) {
                    this.error("Failed to get messages: " + err.message, msg);
                    this.status({ fill: 'red', shape: 'ring', text: 'error' });
                }
                if (done)
                    done();
            });
        }
        else {
            this.status({ fill: 'red', shape: 'ring', text: 'no credentials' });
        }
    }
    RED.nodes.registerType('linkedin-get-messages', LinkedInGetMessages);
};
//# sourceMappingURL=linkedin-service-bot.js.map