# node-red-contrib-linkedin-service-bot

Node-RED nodes for interacting with LinkedIn messaging service. Send and receive messages, poll conversations, and retrieve message history from LinkedIn.

## Features

- **Credentials Management**: Secure credential storage through Node-RED's built-in credential system
- **Message Polling**: Automatically poll LinkedIn conversations for new messages
- **Send Messages**: Send messages to LinkedIn profiles or existing conversations
- **Fetch Conversations**: Retrieve messages and conversation history
- **Dual-Mode Support**: Works with both Node-RED (production) and local Node.js testing environments

## Installation

### For Node-RED

```bash
npm install node-red-contrib-linkedin-service-bot
```

Then in Node-RED, restart the server and the LinkedIn nodes will appear in the palette.

### For Local Development & Testing

```bash
npm install
npm run build
```

## Configuration

### Node-RED Mode (Production)

1. Deploy the package to your Node-RED installation
2. In the Node-RED editor, add a **LinkedIn Credentials** config node
3. Enter your LinkedIn email and password
4. Use the credentials config with message-in, message-out, and get-messages nodes

**Credentials Node** manages authentication:
- Email: Your LinkedIn account email
- Password: Your LinkedIn password (encrypted by Node-RED)

### Local Testing Mode

For local development and testing without Node-RED:

#### 1. Setup Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
LINKEDIN_EMAIL=your-email@example.com
LINKEDIN_PASSWORD=your-password
TEST_RECIPIENT_ID=urn:li:member:123456
```

⚠️ **Security Note**: `.env` is in `.gitignore` - never commit it with real credentials!

#### 2. Run Local Tests

Start the interactive test runner:

```bash
npm run test:local
```

This launches an interactive CLI menu with options to:
- Test credentials (verify login)
- Poll messages (test message-in node)
- Fetch conversations (test get-messages node)
- Send test messages (test message-out node)

Example output:
```
🚀 LinkedIn Service Bot - Local Test Runner

📋 Test Menu:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Test Credentials (Login)
2. Test Message In (Poll Messages)
3. Test Get Messages (Fetch Conversations)
4. Test Message Out (Send Message)
5. Exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Node Types

### LinkedIn Credentials (Config Node)
Manages connection to LinkedIn. Configure once and reuse across other nodes.
- **Properties**: Email, Password (encrypted)
- **Used by**: All other LinkedIn nodes

### LinkedIn Message In (Input Node)
Polls LinkedIn conversations for new messages.
- **Output**: Message objects with payload, conversationId, sender
- **Poll Interval**: Configurable (default: 10 seconds)
- **Use case**: Trigger flows on incoming LinkedIn messages

### LinkedIn Message Out (Output Node)
Sends a message to a LinkedIn profile or conversation.
- **Input**: Message object with `payload` (text), `conversationId` or `profileId`
- **Status**: Shows when message is sent
- **Use case**: Reply to messages, send notifications

### LinkedIn Get Messages (Input/Output Node)
Fetches messages from a conversation or all conversations.
- **Input**: Message with optional `conversationId`
- **Output**: Arrays of messages or conversations
- **Use case**: Retrieve conversation history

## Usage Examples

### Example 1: Reply to New Messages

```
[LinkedIn Message In] → [Filter/Process] → [LinkedIn Message Out]
```

The message-in node polls for new messages and outputs them. Process as needed and send responses via message-out.

### Example 2: Fetch Conversation History

```
[Inject] → [LinkedIn Get Messages] → [Debug/Process]
```

Inject a conversationId in the message and get full conversation history.

### Example 3: Send Alert Messages

```
[External Event] → [LinkedIn Message Out]
```

Send notifications to LinkedIn profiles via your configured credentials.

## Development

### Build

Compile TypeScript to JavaScript for Node-RED:

```bash
npm run build
```

Outputs: `linkedin-service-bot.js` (Node-RED nodes)

### Local Testing

```bash
npm run test:local
```

Runs interactive test suite using credentials from `.env`

### Build CLI for Distribution

```bash
npm run build:cli
```

Outputs compiled CLI to `dist/cli.js`

## Architecture

```
┌─────────────────────────────────────────────┐
│   LinkedIn Service Bot - Dual Mode          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  src/lib/linkedinClient.ts          │   │
│  │  (Reusable Client Manager)          │   │
│  └─────────────────────────────────────┘   │
│           ↓                   ↓             │
│  ┌─────────────────┐  ┌──────────────┐    │
│  │  Node-RED Nodes │  │  Test Runner │    │
│  │  (Production)   │  │  (Local Dev)  │    │
│  └─────────────────┘  └──────────────┘    │
│           ↓                   ↓             │
│  linkedin-service-bot.js    cli.ts         │
│  (Compiled for Node-RED)    (Compiled CLI) │
│                                             │
└─────────────────────────────────────────────┘
```

### Key Files

- `src/linkedin-service-bot.ts` - Node-RED node definitions
- `src/lib/linkedinClient.ts` - Reusable LinkedIn client manager
- `src/lib/testRunner.ts` - Local test harness
- `src/cli.ts` - Interactive CLI tool for local testing
- `linkedin-service-bot.js` - Compiled Node-RED nodes (generated)
- `.env.example` - Template for local testing credentials

## Troubleshooting

### "LinkedIn login failed"
- Verify email and password in Node-RED config or `.env`
- Check LinkedIn account security settings
- Ensure account is not locked due to multiple login attempts

### No messages appearing
- Check poll interval (longer = less frequent checks)
- Verify you have active LinkedIn conversations
- Check Node-RED logs for errors

### "linkedin-private-api" errors
- May indicate LinkedIn has changed their API
- Update the package: `npm update linkedin-private-api`
- Check the package's GitHub for known issues

## Security

- **Node-RED Mode**: Credentials are encrypted by Node-RED's credential system
- **Local Testing**: Use `.env` files which are git-ignored
- **Never commit**: `.env` files with real credentials
- **Best Practice**: Use a test/secondary LinkedIn account for development

## License

MIT

## Contributors

- Stefan W (scaw.dev@gmail.com)
- Andrii Trybynenko (tamerjlah@gmail.com)

