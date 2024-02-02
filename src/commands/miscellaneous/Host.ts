import {
    Client, Discord, ModalComponent, Slash,
} from 'discordx';
import {
    ActionRowBuilder, CommandInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { Category } from '@discordx/utilities';

@Discord()
@Category('Miscellaneous')
export class Host {
    /**
     * Host content on Bigscreen
     * @param interaction - The command interaction.
     * @param client - The Discord client.
     */
    @Slash({ description: 'Host content on Bigscreen' })
    async host(interaction: CommandInteraction, client: Client): Promise<void> {
        // Creating a modal for hosting content
        const contentHostModal = new ModalBuilder()
            .setTitle('Host Content')
            .setCustomId('hostContent');

        // Creating text input fields for an IMDb link and timezone
        const imdbField = new TextInputBuilder()
            .setCustomId('imdbField')
            .setLabel('IMDb link to the content you wish to host.')
            .setStyle(TextInputStyle.Short);

        const timezoneField = new TextInputBuilder()
            .setCustomId('timezone')
            .setLabel('Enter your timezone *e.g. GMT*')
            .setStyle(TextInputStyle.Short);

        // Creating action rows with the respective input fields
        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
            imdbField,
        );

        const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
            timezoneField,
        );

        // Adding the action rows to the modal
        contentHostModal.addComponents(row1, row2);

        // Displaying the modal in response to the interaction
        await interaction.showModal(contentHostModal);
    }

    /**
     * Handles modal submit event
     * @param interaction - The ModalSubmitInteraction object that represents the user's interaction with the modal.
     */
    @ModalComponent({ id: 'hostContent' })
    async modalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
        // Retrieving values from text input fields
        const [imdbField, timezone] = ['imdbField', 'timezone'].map((id) => interaction.fields.getTextInputValue(id));

        // Ensure imdbField is a valid URL
        const imdbRegexPattern = /^(https?:\/\/)?(www\.|m\.)?imdb\.com\/title\/tt\d+\/?$/i;
        if (!imdbRegexPattern.test(imdbField)) {
            return interaction.reply('The IMDb link you provided is invalid. Please double-check and try again.');
        }
    }
}
