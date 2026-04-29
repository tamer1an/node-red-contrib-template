import { NodeProperties, Red } from 'node-red';
import { Client } from 'linkedin-private-api';

interface CredsNode extends NodeProperties {
  username: string;
  credentials: {
    password?: string;
  };
}

module.exports = function (RED: Red) {
  'use strict';

  function LinkedInCredentialsNode(this: any, n: CredsNode) {
    RED.nodes.createNode(this, n);
    this.name = n.name;
    this.username = n.username;
    this.password = this.credentials ? this.credentials.password : '';
    
    this.getClient = async () => {
      if (!this.client) {
        this.client = new Client();
        await this.client.login.userPass({ username: this.username, password: this.password });
      }
      return this.client;
    };
  }

  RED.nodes.registerType('linkedin-credentials', LinkedInCredentialsNode, {
    credentials: {
      password: { type: 'password' }
    }
  });

  // Message IN node
  function LinkedInMessageIn(this: any, n: any) {
    RED.nodes.createNode(this, n);
    this.creds = RED.nodes.getNode(n.creds);
    const pollInterval = parseInt(n.pollInterval) || 10;

    let lastEventTime = Date.now();
    let pollTimer: NodeJS.Timeout | null = null;

    if (this.creds) {
      this.status({ fill: 'yellow', shape: 'dot', text: 'connecting...' });
      
      const startPolling = async () => {
        try {
          const client = await this.creds.getClient();
          this.status({ fill: 'green', shape: 'dot', text: 'connected' });

          pollTimer = setInterval(async () => {
            try {
              const conversations = await client.message.getConversations();
              // In linkedin-private-api, conversations is a Scroller
              // We just fetch the first page
              if (!conversations || !conversations.elements) return;

              for (const conv of conversations.elements) {
                const events = await client.message.getMessages({ conversationId: (conv.entityUrn.split(':').pop() as string) });
                if (!events || !events.elements) continue;
                
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
            } catch (err) {
              this.error("Error polling messages: " + err.message);
            }
          }, pollInterval * 1000);
        } catch (err) {
          this.status({ fill: 'red', shape: 'ring', text: 'login failed' });
          this.error("Login failed: " + err.message);
        }
      };

      startPolling();

      this.on('close', (done: () => void) => {
        if (pollTimer) clearInterval(pollTimer);
        done();
      });
    } else {
      this.status({ fill: 'red', shape: 'ring', text: 'no credentials' });
    }
  }
  RED.nodes.registerType('linkedin-message-in', LinkedInMessageIn);

  // Message OUT node
  function LinkedInMessageOut(this: any, n: any) {
    RED.nodes.createNode(this, n);
    this.creds = RED.nodes.getNode(n.creds);

    if (this.creds) {
      this.status({ fill: 'green', shape: 'dot', text: 'ready' });

      this.on('input', async (msg: any, send: any, done: any) => {
        try {
          const client = await this.creds.getClient();
          if (msg.conversationId) {
            await client.message.sendMessage({
              conversationId: msg.conversationId,
              text: msg.payload
            });
            this.status({ fill: 'blue', shape: 'dot', text: 'sent' });
            send(msg);
          } else if (msg.profileId) {
            await client.message.sendMessage({
              profileId: msg.profileId,
              text: msg.payload
            });
            this.status({ fill: 'blue', shape: 'dot', text: 'sent' });
            send(msg);
          } else {
            this.error("Missing msg.conversationId or msg.profileId", msg);
            this.status({ fill: 'red', shape: 'ring', text: 'error' });
          }
        } catch (err) {
          this.error("Failed to send message: " + err.message, msg);
          this.status({ fill: 'red', shape: 'ring', text: 'error' });
        }
        if (done) done();
      });
    } else {
      this.status({ fill: 'red', shape: 'ring', text: 'no credentials' });
    }
  }
  RED.nodes.registerType('linkedin-message-out', LinkedInMessageOut);

  // Get Messages node
  function LinkedInGetMessages(this: any, n: any) {
    RED.nodes.createNode(this, n);
    this.creds = RED.nodes.getNode(n.creds);

    if (this.creds) {
      this.status({ fill: 'green', shape: 'dot', text: 'ready' });

      this.on('input', async (msg: any, send: any, done: any) => {
        try {
          const client = await this.creds.getClient();
          if (msg.conversationId) {
            const events = await client.message.getMessages({ conversationId: msg.conversationId });
            msg.payload = events.elements || [];
            send(msg);
            this.status({ fill: 'blue', shape: 'dot', text: 'fetched' });
          } else {
            // fetch all recent conversations
            const convs = await client.message.getConversations();
            msg.payload = convs.elements || [];
            send(msg);
            this.status({ fill: 'blue', shape: 'dot', text: 'fetched' });
          }
        } catch (err) {
          this.error("Failed to get messages: " + err.message, msg);
          this.status({ fill: 'red', shape: 'ring', text: 'error' });
        }
        if (done) done();
      });
    } else {
      this.status({ fill: 'red', shape: 'ring', text: 'no credentials' });
    }
  }
  RED.nodes.registerType('linkedin-get-messages', LinkedInGetMessages);
};
