import { Discord, Slash, SlashOption } from 'discordx';
import { ApplicationCommandOptionType, CommandInteraction, PermissionsBitField } from 'discord.js';
import { Category } from '@discordx/utilities';

@Discord()
@Category('Staff')
export class Say {
    /**
     * Send a message as the bot
     * @param string - Text to send as the bot
     * @param interaction - The command interaction.
     */
    @Slash({
        description: 'Send a message as the bot',
        defaultMemberPermissions: [PermissionsBitField.Flags.ManageMessages],
    })
    async say(
        @SlashOption({
            description: 'The text to send as the bot',
            name: 'text',
            required: true,
            type: ApplicationCommandOptionType.String,
            minLength: 4,
        })
            string: string,
            interaction: CommandInteraction,
    ) {
        // Delete the initial interaction response
        await interaction.deferReply();
        await interaction.deleteReply();

        // Send a message to the interaction channel with the specified string
        await interaction.channel?.send(string);
    }
}
