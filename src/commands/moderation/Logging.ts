import { Discord, Slash, SlashOption } from 'discordx';
import {
    ApplicationCommandOptionType, ChannelType, CommandInteraction, PermissionsBitField, TextChannel,
} from 'discord.js';
import { Category } from '@discordx/utilities';
import { setDb } from '../../utils/Util.js';

@Discord()
@Category('Staff')
export class Logging {
    /**
     * Allows configuration of the event logging module
     * @param channel - The channel event logs will send in
     * @param interaction - The command interaction.
     */
    @Slash({
        description: 'Configure the event logging module',
        defaultMemberPermissions: [PermissionsBitField.Flags.ManageMessages],
    })
    async logging(
        @SlashOption({
            description: 'The channel event logs will send to',
            name: 'channel',
            required: true,
            type: ApplicationCommandOptionType.Channel,
        })
            channel: TextChannel,
            interaction: CommandInteraction,
    ) {
        // Check if the bot has the SendMessages permission in the specified channel
        if (!channel.permissionsFor(channel.guild.members.me!).has(PermissionsBitField.Flags.SendMessages)) {
            return interaction.reply({
                content: `I am missing the \`SendMessages\` permission in ${channel}.\nPlease grant me this permission and try running the command again.`,
            });
        }

        // If the channel is not a GuildText channel, return an error
        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                content: 'The specified channel was not a text channel.',
            });
        }

        // Set the hosting channel for the guild in the Keyv database
        await setDb(interaction.guild!.id, { eventLogging: channel.id });

        // Send a confirmation message about the updated hosting channel
        await interaction.reply({
            content: `Event logs will now send to ${channel}.`,
        });
    }
}
