export async function UserInfoHandler(message, args) {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member) return message.reply("Couldn't fetch your member data.");

    const roles = member.roles.cache
        .filter(role => role.id !== message.guild.id)
        .map(role => `${role.name} ${role.id}`)
        .join(', ');

    message.reply(`Your roles: ${roles || "No roles assigned"}`);

}