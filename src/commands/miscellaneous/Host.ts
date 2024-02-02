import {
    Client, Discord, ModalComponent, Slash,
} from 'discordx';
import {
    ActionRowBuilder, CommandInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { Category } from '@discordx/utilities';
import { isValidIMDbURL, isValidTimeZone } from '../../utils/Util.js';

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
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const timezoneField = new TextInputBuilder()
            .setCustomId('timezone')
            .setLabel('Enter your timezone *e.g. GMT*')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const roomField = new TextInputBuilder()
            .setCustomId('roomId')
            .setLabel('Enter the room invite ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        // Creating action rows with the respective input fields
        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
            imdbField,
        );

        const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
            timezoneField,
        );

        const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
            roomField,
        );

        // Adding the action rows to the modal
        contentHostModal.addComponents(row1, row2, row3);

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
        const [imdbField, timezone, roomId] = ['imdbField', 'timezone', 'roomId'].map((id) => interaction.fields.getTextInputValue(id));

        // Validate IMDb URL and timezone
        const isIMDbURLValid = isValidIMDbURL(imdbField);
        const isTimeZoneValid = isValidTimeZone(timezone);

        if (!isIMDbURLValid || !isTimeZoneValid) {
            const invalidInputs = [];

            if (!isIMDbURLValid) {
                invalidInputs.push('IMDb link');
            }

            if (!isTimeZoneValid) {
                invalidInputs.push('timezone');
            }

            const errorMessage = `The provided ${invalidInputs.join(' and ')} ${invalidInputs.length > 1 ? 'are' : 'is'} invalid.\nPlease double-check and try again.`;

            await interaction.reply(errorMessage);
        }
    }
}
