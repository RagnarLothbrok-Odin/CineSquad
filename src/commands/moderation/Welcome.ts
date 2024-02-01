import { Discord, Slash, SlashOption } from 'discordx';
import {
    ApplicationCommandOptionType, ChannelType, CommandInteraction, PermissionsBitField, TextChannel,
} from 'discord.js';
import { Category } from '@discordx/utilities';
import { KeyvInstance } from '../../utils/Util.js';

@Discord()
@Category('Staff')
export class Welcome {
    /**
     * Allows configuration of the welcome module
     * @param channel - The channel alerts will be sent to
     * @param interaction - The command interaction.
     */
    @Slash({
        description: 'Configure the welcome module',
        defaultMemberPermissions: [PermissionsBitField.Flags.ManageMessages],
    })
    async welcome(
        @SlashOption({
            description: 'The channel welcome messages should be sent to',
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

        // Set the welcome channel for the guild in the Keyv database
        await KeyvInstance().set(interaction.guild!.id, {
            welcome: channel.id,
        });

        // Send a confirmation message about the updated welcome channel
        await interaction.reply({
            content: `Welcome messages will now be sent to ${channel}.`,
        });
    }
}
