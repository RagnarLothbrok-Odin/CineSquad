import {
    ButtonComponent, Discord, ModalComponent, Slash,
} from 'discordx';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
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
    ThreadChannel,
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
            .setLabel('IMDb link to the content you wish to host')
            .setPlaceholder('https://www.imdb.com/title/tt0926084')
            .setStyle(TextInputStyle.Short)
            .setMinLength(24)
            .setRequired(true);

        const timezoneField = new TextInputBuilder()
            .setCustomId('timezone')
            .setLabel('Enter your timezone')
            .setPlaceholder('e.g., GMT')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(5)
            .setRequired(true);

        const startField = new TextInputBuilder()
            .setCustomId('startTime')
            .setLabel('Start time')
            .setPlaceholder('e.g., 7:30PM')
            .setStyle(TextInputStyle.Short)
            .setMinLength(6)
            .setMaxLength(7)
            .setRequired(true);

        const dateField = new TextInputBuilder()
            .setCustomId('startDate')
            .setLabel('Date (e.g., 05/02) or leave blank for today')
            .setPlaceholder('Enter date (day/month) or leave blank')
            .setStyle(TextInputStyle.Short)
            .setMinLength(5)
            .setMaxLength(5)
            .setRequired(false);

        const roomField = new TextInputBuilder()
            .setCustomId('roomId')
            .setLabel('Enter the room invite ID')
            .setPlaceholder('e.g., ABC123')
            .setStyle(TextInputStyle.Short)
            .setMinLength(6)
            .setMaxLength(6)
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
            dateField,
        );

        const row5 = new ActionRowBuilder<TextInputBuilder>().addComponents(
            roomField,
        );

        // Adding the action rows to the modal
        contentHostModal.addComponents(row1, row2, row3, row4, row5);

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
        const [imdbField, timezone, startTime, startDate, roomId] = ['imdbField', 'timezone', 'startTime', 'startDate', 'roomId'].map((id) => interaction.fields.getTextInputValue(id));

        // Check if only one is provided
        if ((timezone && !startTime) || (!timezone && startTime)) {
            await interaction.editReply('Both timezone and start time are optional, but if you modify one, you need to update both together. Please provide both or leave both unchanged.');
            return;
        }

        // Check if startDate is provided but without a startTime/timezone
        if (startDate && (!timezone || !startTime)) {
            await interaction.editReply('If you provide a start date, you must also provide both timezone and start time.');
            return;
        }

        // Validate IMDb URL and timezone
        const imdbRegexPattern = /https?:\/\/(www\.|m\.)?imdb\.com\/title\/tt(\d+)(\/)?/;

        const isIMDbURLValid = imdbField.match(imdbRegexPattern);
        const isTimeZoneValid = isValidTimeZone(timezone);
        const isTimeValid = isValidTime(startTime, timezone, startDate);

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
                { name: 'Hosted By', value: `${interaction.member}` },
                { name: 'Start Time', value: startEpoch, inline: true },
                { name: 'Room Invite ID', value: `${roomId.toUpperCase() || '`Unavailable`'}`, inline: true },
            )
            .setDescription(
                `${codeBlock('text', `${details!.plot}`)}`,
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
                .setCustomId(`button_Details_${interaction.user.id}`)
                .setLabel('Change Details')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`button_LockThread_${interaction.user.id}`)
                .setLabel('Lock Thread')
                .setStyle(ButtonStyle.Danger),
        );

        if (channel) {
            // Attempt to create the thread
            const thread = await channel.threads.create({
                name: `${details!.title} (${details!.year})`,
                autoArchiveDuration: 1440,
                reason: 'Needed a separate thread for food',
                message: { embeds: [embed], components: [row1, row2] },
            });

            // Add the interaction author to the thread
            await thread.members.add(interaction.user.id);

            await interaction.editReply(`${interaction.member} is hosting ${thread}, at ${startEpoch}`);
        }
    }

    @ButtonComponent({ id: /^button_(Details|LockThread)_(\d+)$/ })
    async buttonInteraction(interaction: ButtonInteraction) {
        const button = interaction.customId.split('_');

        // Return an error if the button clicker was not the original thread owner
        if (interaction.user.id !== button[2]) {
            await interaction.reply({ content: 'This button is reserved for the thread host.', ephemeral: true });
        }

        // Creating a modal for hosting content
        const changeDetailsModal = new ModalBuilder()
            .setTitle('Change Details')
            .setCustomId('changeDetails');

        // If the button clicked was Details
        if (button[1] === 'Details') {
            const changeTimezone = new TextInputBuilder()
                .setCustomId('changeTimezone')
                .setLabel('Enter your timezone')
                .setPlaceholder('e.g., GMT')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(5)
                .setRequired(false);

            const changeStartTime = new TextInputBuilder()
                .setCustomId('changeStartTime')
                .setLabel('Start time')
                .setPlaceholder('e.g., 7:30PM')
                .setStyle(TextInputStyle.Short)
                .setMinLength(6)
                .setMaxLength(7)
                .setRequired(false);

            const changeDate = new TextInputBuilder()
                .setCustomId('changeDate')
                .setLabel('Date (e.g., 05/02) or leave blank for today')
                .setPlaceholder('Enter date (day/month) or leave blank')
                .setStyle(TextInputStyle.Short)
                .setMinLength(5)
                .setMaxLength(5)
                .setRequired(false);

            const changeInviteId = new TextInputBuilder()
                .setCustomId('changeInviteId')
                .setLabel('Enter the room invite ID')
                .setPlaceholder('e.g., ABC123')
                .setStyle(TextInputStyle.Short)
                .setMinLength(6)
                .setMaxLength(6)
                .setRequired(false);

            // Creating action rows with the respective input fields
            const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
                changeTimezone,
            );

            const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
                changeStartTime,
            );

            const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
                changeDate,
            );

            const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(
                changeInviteId,
            );

            // Adding the action rows to the modal
            changeDetailsModal.addComponents(row1, row2, row3, row4);

            // Displaying the modal in response to the interaction
            await interaction.showModal(changeDetailsModal);
        }

        // If the button clicked was StartTime
        if (button[1] === 'LockThread') {
            try {
                await interaction.reply({ content: `Thread has been successfully locked.\nThank you for hosting, ${interaction.member}` });
                await (interaction.channel as ThreadChannel).setLocked(true);
            } catch {
                await interaction.reply({ content: 'An error occurred. Please try again.', ephemeral: true });
            }
        }
    }

    /**
     * Handles modal submit event
     * @param interaction - The ModalSubmitInteraction object that represents the user's interaction with the modal.
     */
    @ModalComponent({ id: 'changeDetails' })
    async changeModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
        await interaction.deferReply();

        // Retrieving values from text input fields
        const [changeTimezone, changeStartTime, changeDate, changeInviteId] = ['changeTimezone', 'changeStartTime', 'changeDate', 'changeInviteId'].map((id) => interaction.fields.getTextInputValue(id));

        if (!changeTimezone && !changeStartTime && !changeInviteId) return interaction.deleteReply();

        // Check if only one is provided
        if ((changeTimezone && !changeStartTime) || (!changeTimezone && changeStartTime)) {
            await interaction.editReply('Both timezone and start time are optional, but if you modify one, you need to update both together. Please provide both or leave both unchanged.');
            return;
        }

        // Check if startDate is provided but without a startTime/timezone
        if (changeDate && (!changeTimezone || !changeStartTime)) {
            await interaction.editReply('If you provide a start date, you must also provide both timezone and start time.');
            return;
        }

        const isTimeZoneValid = isValidTimeZone(changeTimezone);
        const isTimeValid = isValidTime(changeStartTime, changeTimezone, changeDate);

        if (changeTimezone || changeStartTime) {
            if (!isTimeZoneValid || !isTimeValid) {
                const invalidInputs = [];

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
        }

        const startEpoch = isTimeValid;

        // Fetch the message
        const fetchMessage = interaction.channel?.messages.fetch(interaction.message!.id);

        // Fetch the embed data
        fetchMessage?.then(async (res) => {
            const embed = res.embeds[0]; // Assuming the embed is the first one

            // Find the desired fields
            const startTimeField = embed.fields.find((field) => field.name === 'Start Time');
            const roomInviteIDField = embed.fields.find((field) => field.name === 'Room Invite ID');

            // Handle cases where fields are not found:
            if (!startTimeField || !roomInviteIDField) {
                await interaction.editReply('An error occurred. Please try again.');
                return;
            }

            // Message to send on completion
            const updatedDetails = 'Details Updated:\n'
                + `${startEpoch ? `Start Time: ~~${startTimeField.value}~~ > ${startEpoch}\n` : ''}`
                + `${changeInviteId ? `Invite ID: ${roomInviteIDField.value === 'Unavailable' ? `\`${changeInviteId}\`` : `~~\`${roomInviteIDField.value}\`~~ > \`${changeInviteId}\``}` : ''}`;

            // Update the field values:
            startTimeField.value = startEpoch || startTimeField.value;
            roomInviteIDField.value = changeInviteId ? changeInviteId.toUpperCase() : roomInviteIDField.value;

            // Create a new embed object manually:
            const newEmbed = new EmbedBuilder()
                .setColor(embed.color)
                .setAuthor(embed.author)
                .addFields(
                    ...embed.fields.filter((field) => field !== startTimeField && field !== roomInviteIDField),
                    startTimeField,
                    roomInviteIDField,
                )
                .setDescription(embed.description)
                .setImage(embed.image!.url);

            // Edit the original message with the new embed:
            await interaction.message?.edit({
                embeds: [newEmbed],
                components: res.components,
            });

            await interaction.editReply({
                content: updatedDetails,
            });
        });
    }
}
