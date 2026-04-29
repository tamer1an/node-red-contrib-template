#!/usr/bin/env node

import * as readline from 'readline';
import { TestRunner } from './lib/testRunner';

// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    // Get credentials from environment or prompt user
    let email = process.env.LINKEDIN_EMAIL;
    let password = process.env.LINKEDIN_PASSWORD;

    if (!email) {
      email = await prompt('LinkedIn Email: ');
    }
    if (!password) {
      password = await prompt('LinkedIn Password: ');
    }

    if (!email || !password) {
      console.error('Error: LinkedIn email and password are required');
      console.error('Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in .env file or provide when prompted');
      rl.close();
      process.exit(1);
    }

    // Initialize test runner
    console.log('\n🚀 LinkedIn Service Bot - Local Test Runner\n');
    console.log('Initializing with credentials from .env...\n');

    const testRunner = new TestRunner(email, password);

    // Main menu
    let running = true;
    while (running) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Test Menu:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Test Credentials (Login)');
      console.log('2. Test Message In (Poll Messages)');
      console.log('3. Test Get Messages (Fetch Conversations)');
      console.log('4. Test Message Out (Send Message)');
      console.log('5. Exit');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const choice = await prompt('Select an option (1-5): ');

      switch (choice.trim()) {
        case '1': {
          console.log('\n⏳ Testing credentials...\n');
          const result = await testRunner.testCredentials();
          testRunner.addResult('testCredentials', result);
          console.log(result.success ? '✅ Success:' : '❌ Failed:');
          console.log(result.message);
          break;
        }

        case '2': {
          console.log('\n⏳ Polling for messages (checking recent conversations)...\n');
          const result = await testRunner.testMessageIn(5);
          testRunner.addResult('testMessageIn', result);

          if (result.success) {
            console.log(
              `✅ Success: Found ${result.conversationsCount} conversations with ${result.messagesCount} messages\n`
            );
            if (result.messages.length > 0) {
              console.log('📨 Recent Messages:');
              result.messages.slice(0, 5).forEach((msg: any, i: number) => {
                console.log(`  ${i + 1}. From: ${msg.sender}`);
                console.log(`     Text: ${msg.text.substring(0, 80)}${msg.text.length > 80 ? '...' : ''}`);
                console.log(`     Date: ${msg.createdAt}`);
                console.log();
              });
            }
          } else {
            console.log('❌ Failed:');
            console.log(result.error);
          }
          break;
        }

        case '3': {
          const convId = await prompt('Enter Conversation ID (or leave blank to fetch all): ');
          console.log('\n⏳ Fetching messages...\n');
          const result = await testRunner.testGetMessages(convId || undefined);
          testRunner.addResult('testGetMessages', result);

          if (result.success) {
            if (convId) {
              console.log(`✅ Success: Found ${result.messageCount} messages in conversation\n`);
              if (result.messages.length > 0) {
                console.log('Messages:');
                result.messages.slice(0, 10).forEach((msg: any, i: number) => {
                  console.log(`  ${i + 1}. ${JSON.stringify(msg, null, 2)}`);
                });
              }
            } else {
              console.log(`✅ Success: Found ${result.conversationCount} conversations\n`);
              if (result.conversations.length > 0) {
                console.log('Conversations:');
                result.conversations.slice(0, 10).forEach((conv: any, i: number) => {
                  console.log(`  ${i + 1}. ID: ${conv.entityUrn}`);
                });
              }
            }
          } else {
            console.log('❌ Failed:');
            console.log(result.error);
          }
          break;
        }

        case '4': {
          const targetType = await prompt('Send to Conversation ID or Profile ID? (conv/profile): ');
          let conversationId: string | undefined;
          let profileId: string | undefined;

          if (targetType.toLowerCase() === 'conv') {
            conversationId = await prompt('Enter Conversation ID: ');
          } else {
            profileId = await prompt('Enter Profile ID: ');
          }

          const messageText = await prompt('Enter message text: ');

          if (!conversationId && !profileId) {
            console.log('❌ Error: Either Conversation ID or Profile ID is required');
            break;
          }

          console.log('\n⏳ Sending message...\n');
          const result = await testRunner.testMessageOut({
            conversationId,
            profileId,
            text: messageText
          });
          testRunner.addResult('testMessageOut', result);

          if (result.success) {
            console.log('✅ ' + result.message);
          } else {
            console.log('❌ ' + result.error);
          }
          break;
        }

        case '5': {
          running = false;
          console.log('\n👋 Exiting...\n');
          break;
        }

        default: {
          console.log('\n❌ Invalid option. Please select 1-5.');
          break;
        }
      }
    }

    // Print summary
    const results = testRunner.getResults();
    if (results.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Test Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      results.forEach((r) => {
        const status = r.result.success ? '✅' : '❌';
        console.log(`${status} ${r.test} at ${r.timestamp}`);
      });
      console.log();
    }

    rl.close();
  } catch (err) {
    console.error('Fatal error:', (err as Error).message);
    rl.close();
    process.exit(1);
  }
}

main();
