import { log } from "../utils/Logger.js";
import chalk from "chalk";
import { PermissionsBitField } from "discord.js";

export async function DeleteMessageHandler(message, params) {
    const member = message.guild.members.cache.get(message.author.id);
    const permissionsSet = new Set();
    for (const role of member.roles.cache.values()) {
        for (const permission of role.permissions.toArray()) {
            permissionsSet.add(PermissionsBitField.Flags[permission]);
        }
    }
    const permissions = Array.from(permissionsSet);

    if (!permissions.find(permission => permission === PermissionsBitField.Flags.ManageMessages)) {
        log(`[${chalk.yellow("Warning")}] User ${message.author.username} does not have the required permissions to delete messages.`);
        message.reply("You do not have the required permissions to delete messages.");
        return;
    }

    const amount = Number.parseInt(params[0]);
    if (Number.isNaN(amount)) {
        message.reply("Please provide a valid number of messages to delete.");
    }
    else {
        if (amount < 1 || amount > 50) {
            message.reply("You can only delete between 1 and 50 messages.");
            log(`[${chalk.yellow("Warning")}] User ${message.author.username} tried to delete more than 50 messages.`);
            return;
        }
        try {
            const messages = await message.channel.messages.fetch({
                limit: amount + 1,
            })
            for (const msg of messages.values()) {
                log(`[${chalk.magenta("Delete")}] Deleting message: "${msg.content}" of user ${msg.author.username}`);
                await msg.delete();
            }
            log(`[${chalk.green("Success")}] Deleted ${amount} messages.`);
        }
        catch (error) {
            log(`[${chalk.red("Error")}] ${error}`);
            message.reply("An error occurred while trying to delete messages.");
        }
    }
}