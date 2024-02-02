import { Discord, ModalComponent, Slash } from 'discordx';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    codeBlock,
    CommandInteraction,
    EmbedBuilder,
    ForumChannel,
    ModalBuilder,
    ModalSubmitInteraction,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { Category } from '@discordx/utilities';
import {
    deleteGuildProperty, getContentDetails, isValidTime, isValidTimeZone, KeyvInstance,
} from '../../utils/Util.js';

@Discord()
@Category('Miscellaneous')
export class Host {
    /**
     * Host content on Bigscreen
     * @param interaction - The command interaction.
     * @param client - The Discord client.
     */
    @Slash({ description: 'Host content on Bigscreen' })
    async host(interaction: CommandInteraction) {
        // Check if the hosting feature is enabled
        // Retrieve data for the current guild from Keyv
        const data = await KeyvInstance()
            .get(interaction.guild!.id);

        // Check if 'hosting' property exists in the data
        if (data && data.hosting) {
            // Retrieve the channel using the stored ID
            const channel = interaction.guild?.channels.cache.get(data.hosting);

            // Check if the channel exists and the bot has SendMessages permission
            if (!channel || !channel.permissionsFor(channel.guild.members.me!).has([
                PermissionsBitField.Flags.CreatePublicThreads,
                PermissionsBitField.Flags.ManageThreads,
                PermissionsBitField.Flags.SendMessagesInThreads,
            ])) {
                // If the channel doesn't exist or bot lacks permissions, remove 'hosting' property
                await deleteGuildProperty(interaction.guild!.id, 'hosting');

                return interaction.reply('Hosting is currently disabled on this server. Please reach out to a staff member for assistance in configuring it.');
            }
        }

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

        const startField = new TextInputBuilder()
            .setCustomId('startTime')
            .setLabel('Start time *e.g. 7:30PM')
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
            startField,
        );

        const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(
            roomField,
        );

        // Adding the action rows to the modal
        contentHostModal.addComponents(row1, row2, row3, row4);

        // Displaying the modal in response to the interaction
        await interaction.showModal(contentHostModal);
    }

    /**
     * Handles modal submit event
     * @param interaction - The ModalSubmitInteraction object that represents the user's interaction with the modal.
     */
    @ModalComponent({ id: 'hostContent' })
    async modalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
        await interaction.deferReply();

        const data = await KeyvInstance()
            .get(interaction.guild!.id);

        // Retrieve the channel using the stored ID
        const channel = interaction.guild?.channels.cache.get(data.hosting) as ForumChannel;

        // Retrieving values from text input fields
        const [imdbField, timezone, startTime, roomId] = ['imdbField', 'timezone', 'startTime', 'roomId'].map((id) => interaction.fields.getTextInputValue(id));

        // Validate IMDb URL and timezone
        const imdbRegexPattern = /https?:\/\/(www\.|m\.)?imdb\.com\/title\/tt(\d+)(\/)?/;

        const isIMDbURLValid = imdbField.match(imdbRegexPattern);
        const isTimeZoneValid = isValidTimeZone(timezone);
        const isTimeValid = isValidTime(startTime, timezone);

        if (!isIMDbURLValid || !isTimeZoneValid || !isTimeValid) {
            const invalidInputs = [];

            if (!isIMDbURLValid) {
                invalidInputs.push('IMDb link');
            }

            if (!isTimeZoneValid) {
                invalidInputs.push('timezone');
            }

            if (!isTimeValid) {
                invalidInputs.push('start time');
            }

            const errorMessage = `The provided ${invalidInputs.join(' and ')} ${invalidInputs.length > 1 ? 'are' : 'is'} invalid.\nPlease double-check and try again.`;

            await interaction.editReply(errorMessage);
            return;
        }

        const startEpoch = isTimeValid;

        // Data is valid, fetch details
        const details = await getContentDetails(imdbField);

        // Embed to be sent to the created thread
        const embed = new EmbedBuilder()
            .setColor('#e0b10e')
            .setAuthor({
                name: `${details!.title} (${details!.year})`,
                url: imdbField,
                iconURL: 'https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/171_Imdb_logo_logos-1024.png',
            })
            .addFields(
                { name: 'Votes', value: `<:imdb:1202979511755612173>** ${details!.rating}/10** *(${details!.totalVotes.toLocaleString('en')} votes)*`, inline: true },
                { name: 'Genres', value: details!.genres, inline: true },
                { name: 'Stars', value: details!.cast },
            )
            .setDescription(
                `${codeBlock('text', `${details!.plot}`)}\n**Start Time: ${startEpoch}**${roomId ? `\n\n**Invite Code: ${roomId}**\n\n` : ''}`,
            )
            .setImage(details!.image);

        // Buttons to be applied to the embed
        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Open Content')
                .setStyle(ButtonStyle.Link)
                .setURL(imdbField),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('View Reviews')
                .setURL(`https://imdb.com/title/tt${isIMDbURLValid[2]}/ratings`),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('View Cast')
                .setURL(`https://imdb.com/title/tt${isIMDbURLValid[2]}/fullcredits`),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Trivia')
                .setURL(`https://imdb.com/title/tt${isIMDbURLValid[2]}/trivia`),
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('buttonStartTime')
                .setLabel('Change Start Time')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('buttonChangeTimezone')
                .setLabel('Change Time Zone')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('buttonLockThread')
                .setLabel('Lock Thread')
                .setStyle(ButtonStyle.Danger),
        );

        if (channel) {
            // Attempt to create the thread
            const thread = await channel.threads.create({
                name: `${details!.title} (${details!.year})${roomId ? ` - Invite Code: ${roomId}` : ''}`,
                autoArchiveDuration: 1440,
                reason: 'Needed a separate thread for food',
                message: { embeds: [embed], components: [row1, row2] },
            });

            await interaction.editReply(`${interaction.member} is hosting ${thread}, at ${startEpoch}`);
        }
    }
}
