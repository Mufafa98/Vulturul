import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import chalk from 'chalk';

import { CommandDispatcher } from './CommandDispatcher.js';
import { log } from './utils/Logger.js';
dotenv.config();

log(`[${chalk.grey("Info")}] Starting Bot...`);


const client = new Client(
    {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
        ],
    }
);

const commandDispatcher = new CommandDispatcher();
client.on(Events.MessageCreate, commandDispatcher.dispatch);

client.login(process.env.BOT_TOKEN);
log(`[${chalk.green("Success")}] Bot Started!`);


