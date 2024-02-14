import { Discord, Slash, SlashOption } from 'discordx';
import {
    ApplicationCommandOptionType, ChannelType, CommandInteraction, PermissionsBitField, TextChannel,
} from 'discord.js';
import { Category } from '@discordx/utilities';
import { setDb } from '../../utils/Util.js';

@Discord()
@Category('Staff')
export class Forum {
    /**
     * Allows configuration of the hosting module
     * @param channel - The channel host threads will start in
     * @param interaction - The command interaction.
     */
    @Slash({
        description: 'Configure the hosting module',
        defaultMemberPermissions: [PermissionsBitField.Flags.ManageMessages],
    })
    async event(
        @SlashOption({
            description: 'The channel host threads will start in',
            name: 'channel',
            required: true,
            type: ApplicationCommandOptionType.Channel,
        })
            channel: TextChannel,
            interaction: CommandInteraction,
    ) {
        // Check if bot has permissions to manage events
        if (!interaction.guild!.members.me?.permissions.has(PermissionsBitField.Flags.ManageEvents)) {
            return interaction.reply({
                content: 'I am missing the `ManageEvents` permission.\nPlease grant me this permission and try running the command again.',
            });
        }

        // Check if the bot has the SendMessages permission in the specified channel
        if (!channel.permissionsFor(channel.guild.members.me!)
            .has([
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.SendMessages,
            ])) {
            return interaction.reply({
                content: `I am missing the \`SendMessages\` permission in ${channel}.\nPlease grant me this permission and try running the command again.`,
            });
        }

        // If the channel is not a GuildForum channel, return an error
        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                content: 'The specified channel was not a text channel.',
            });
        }

        // Set the hosting channel for the guild in the Keyv database
        await setDb(interaction.guild!.id, { events: channel.id });

        // Send a confirmation message about the updated hosting channel
        await interaction.reply({
            content: `Event URLs will now be sent in ${channel}.`,
        });
    }
}
