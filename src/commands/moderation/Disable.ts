import {
    Discord, Slash, SlashChoice, SlashOption,
} from 'discordx';
import { ApplicationCommandOptionType, CommandInteraction, PermissionsBitField } from 'discord.js';
import { Category } from '@discordx/utilities';
import { deleteGuildProperty, KeyvInstance } from '../../utils/Util.js';

@Discord()
@Category('Staff')
export class Say {
    /**
     * Disable modules for the bot
     * @param module - Text to send as the bot
     * @param interaction - The command interaction.
     */
    @Slash({
        description: 'Disable modules for the bot',
        defaultMemberPermissions: [PermissionsBitField.Flags.ManageGuild],
    })
    async disable(
        @SlashChoice({ name: 'Autorole', value: 'autorole' })
        @SlashChoice({ name: 'Event', value: 'event' })
        @SlashChoice({ name: 'Welcome', value: 'welcome' })
        @SlashOption({
            description: 'Which module should be disabled?',
            name: 'module',
            required: true,
            type: ApplicationCommandOptionType.String,
        })
            module: string,
            interaction: CommandInteraction,
    ) {
        // Retrieve data for the current guild from Keyv
        const data = await KeyvInstance()
            .get(interaction.guild!.id);

        // Check if the module is currently enabled
        if (data && data[module]) {
            // Disable the module and provide confirmation
            await deleteGuildProperty(interaction.guild!.id, module);
            await interaction.reply({ content: `${module.charAt(0).toUpperCase() + module.slice(1)} has been successfully disabled.` });
        } else {
            // The module is not currently enabled
            await interaction.reply({ content: `${module.charAt(0).toUpperCase() + module.slice(1)} is not currently enabled.` });
        }
    }
}
