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
            return;
        }
        try {
            const messages = await message.channel.messages.fetch({
                limit: amount + 1,
            })
            for (const msg of messages.values()) {
                console.log(`[${chalk.yellow("Delete")}] Deleting message: ${msg.content}`);
                await msg.delete();
            }
            console.log(`[${chalk.green("Success")}] Deleted ${amount} messages.`);
        }
        catch (error) {
            console.error(`[${chalk.red("Error")}] ${error}`);
            message.reply("An error occurred while trying to delete messages.");
        }
    }
}