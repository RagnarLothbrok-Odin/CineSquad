import type { ArgsOf } from 'discordx';
import { Discord, Once } from 'discordx';
import { ChannelType, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { deleteGuildProperty, KeyvInstance } from '../utils/Util.js';

/**
 * Discord.js GuildBanAdd event handler.
 */
@Discord()
export class GuildBanAdd {
    /**
     * Executes when the GuildBanAdd event is emitted.
     * @param ban
     * @returns void
     */
    @Once({ event: 'guildBanAdd' })
    async onGuildBanAdd([ban]: ArgsOf<'guildBanAdd'>) {
        // Retrieve data for the current guild from Keyv
        const data = await KeyvInstance()
            .get(ban.guild!.id);

        // If logging is enabled, send to channel
        if (data && data.eventLogging) {
            // Fetch the logging channel
            const channel = ban.guild?.channels.cache.get(data.eventLogging) ?? await ban.guild?.channels.fetch(data.eventLogging);

            // Check if the channel exists, is a text channel, and has the necessary permissions to send messages
            if (channel && channel.type === ChannelType.GuildText
                && channel.permissionsFor(channel.guild.members.me!).has(PermissionsBitField.Flags.SendMessages)) {
                // Create an embed with information about the banned member
                const embed = new EmbedBuilder()
                    .setColor('#FE4611')
                    .setAuthor({ name: 'Member Banned', iconURL: ban.user.displayAvatarURL() })
                    .setThumbnail(ban.user.displayAvatarURL())
                    .setDescription(`${ban} - \`@${ban.user.tag}${ban.user.discriminator !== '0' ? `#${ban.user.discriminator}` : ''}\``)
                    .setFooter({ text: `ID: ${ban.user.id}` })
                    .setTimestamp();

                // Add a field for the ban reason if it exists
                if (ban.reason) {
                    embed.addFields({ name: 'Reason', value: `\`${ban.reason}\`` });
                }

                // Send the embed to the logging channel
                if (channel) channel.send({ embeds: [embed] });
            } else {
                // If the channel doesn't exist or bot lacks SendMessages permission, remove 'welcome' property
                await deleteGuildProperty(ban.guild.id, 'eventLogging');
            }
        }
    }
}
