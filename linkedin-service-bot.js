"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const linkedin_private_api_1 = require("linkedin-private-api");
module.exports = function (RED) {
    'use strict';
    function LinkedInCredentialsNode(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.username = n.username;
        this.password = this.credentials ? this.credentials.password : '';
        this.getClient = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                this.client = new linkedin_private_api_1.Client();
                yield this.client.login.userPass({ username: this.username, password: this.password });
            }
            return this.client;
        });
    }
    RED.nodes.registerType('linkedin-credentials', LinkedInCredentialsNode, {
        credentials: {
            password: { type: 'password' }
        }
    });
    // Message IN node
    function LinkedInMessageIn(n) {
        RED.nodes.createNode(this, n);
        this.creds = RED.nodes.getNode(n.creds);
        const pollInterval = parseInt(n.pollInterval) || 10;
        let lastEventTime = Date.now();
        let pollTimer = null;
        if (this.creds) {
            this.status({ fill: 'yellow', shape: 'dot', text: 'connecting...' });
            const startPolling = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const client = yield this.creds.getClient();
                    this.status({ fill: 'green', shape: 'dot', text: 'connected' });
                    pollTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const conversations = yield client.message.getConversations();
                            // In linkedin-private-api, conversations is a Scroller
                            // We just fetch the first page
                            if (!conversations || !conversations.elements)
                                return;
                            for (const conv of conversations.elements) {
                                const events = yield client.message.getMessages({ conversationId: conv.entityUrn.split(':').pop() });
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
                    }), pollInterval * 1000);
                }
                catch (err) {
                    this.status({ fill: 'red', shape: 'ring', text: 'login failed' });
                    this.error("Login failed: " + err.message);
                }
            });
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
    // Message OUT node
    function LinkedInMessageOut(n) {
        RED.nodes.createNode(this, n);
        this.creds = RED.nodes.getNode(n.creds);
        if (this.creds) {
            this.status({ fill: 'green', shape: 'dot', text: 'ready' });
            this.on('input', (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const client = yield this.creds.getClient();
                    if (msg.conversationId) {
                        yield client.message.sendMessage({
                            conversationId: msg.conversationId,
                            text: msg.payload
                        });
                        this.status({ fill: 'blue', shape: 'dot', text: 'sent' });
                        send(msg);
                    }
                    else if (msg.profileId) {
                        yield client.message.sendMessage({
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
            }));
        }
        else {
            this.status({ fill: 'red', shape: 'ring', text: 'no credentials' });
        }
    }
    RED.nodes.registerType('linkedin-message-out', LinkedInMessageOut);
    // Get Messages node
    function LinkedInGetMessages(n) {
        RED.nodes.createNode(this, n);
        this.creds = RED.nodes.getNode(n.creds);
        if (this.creds) {
            this.status({ fill: 'green', shape: 'dot', text: 'ready' });
            this.on('input', (msg, send, done) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const client = yield this.creds.getClient();
                    if (msg.conversationId) {
                        const events = yield client.message.getMessages({ conversationId: msg.conversationId });
                        msg.payload = events.elements || [];
                        send(msg);
                        this.status({ fill: 'blue', shape: 'dot', text: 'fetched' });
                    }
                    else {
                        // fetch all recent conversations
                        const convs = yield client.message.getConversations();
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
            }));
        }
        else {
            this.status({ fill: 'red', shape: 'ring', text: 'no credentials' });
        }
    }
    RED.nodes.registerType('linkedin-get-messages', LinkedInGetMessages);
};
