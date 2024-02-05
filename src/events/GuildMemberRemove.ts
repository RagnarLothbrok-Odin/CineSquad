import type { ArgsOf, Client } from 'discordx';
import { Discord, Once } from 'discordx';
import { ChannelType, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { deleteGuildProperty, KeyvInstance } from '../utils/Util.js';

/**
 * Discord.js GuildMemberRemove event handler.
 */
@Discord()
export class GuildMemberRemove {
    /**
     * Executes when the GuildMemberRemove event is emitted.
     * @param member
     * @param client - The Discord client.
     * @returns void
     */
    @Once({ event: 'guildMemberRemove' })
    async onGuildMemberRemove([member]: ArgsOf<'guildMemberRemove'>, client: Client) {
        // Retrieve data for the current guild from Keyv
        const data = await KeyvInstance()
            .get(member.guild!.id);

        // If logging is enabled, send to channel
        if (data && data.eventLogging) {
            // Fetch the logging channel
            const channel = await client.channels.fetch(data.eventLogging);

            // Check if the channel exists, is a text channel, and has the necessary permissions to send messages
            if (channel && channel.type === ChannelType.GuildText
                && channel.permissionsFor(channel.guild.members.me!).has(PermissionsBitField.Flags.SendMessages)) {
                // Create an embed with information about the joined member
                const embed = new EmbedBuilder()
                    .setColor('#FE4611')
                    .setThumbnail(member.user.displayAvatarURL())
                    .setAuthor({
                        name: 'Member Left',
                        iconURL: `${member.user.displayAvatarURL()}${member.user.discriminator !== '0' ? `#${member.user.discriminator}` : ''}`,
                    })
                    .setDescription(
                        `${member.user} - \`@${member.user.tag}\``,
                    )
                    .setFooter({ text: `ID: ${member.user.id}` })
                    .setTimestamp();

                // Send the embed to the logging channel
                if (channel) channel.send({ embeds: [embed] });
            } else {
                // If the channel doesn't exist or bot lacks SendMessages permission, remove 'welcome' property
                await deleteGuildProperty(member.guild.id, 'eventLogging');
            }
        }
    }
}
