import { PingHandler } from "./commands/Ping.js";
import { DeleteMessageHandler } from "./commands/DeleteMessage.js";
import { UserInfoHandler } from "./commands/UserInfo.js";
import { PlayHandler, Repeat, PlayNext, Disconect } from "./commands/PlayMusic.js";

export class CommandDispatcher {
    constructor() {
        this.commands = new Map();
        this.commands.set("ping", PingHandler);
        this.commands.set("delete", DeleteMessageHandler);
        this.commands.set("info", UserInfoHandler);
        this.commands.set("play", PlayHandler);
        this.commands.set("repeat", Repeat);
        this.commands.set("next", PlayNext);
        this.commands.set("leave", Disconect);
        this.dispatch = this.dispatch.bind(this);
    }
    async dispatch(command) {
        const command_author = command.author;
        const command_content = command.content;
        if (command_author.bot) return;
        if (command_content.startsWith("\\")) {
            const new_command = command_content.slice(1).split(" ");
            const command_name = new_command[0];
            const command_args = new_command.slice(1);
            if (this.commands.has(command_name)) {
                const command_handler = this.commands.get(command_name);
                await command_handler(command, command_args);
            }
            else {
                await command.reply(`Command not found: ${command_name}`);
            }
        }
    }
}

