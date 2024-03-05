import type { Message } from 'discord.js';
import { Client } from 'discordx';
import 'colors';
import Keyv from 'keyv';
import { DateTime, IANAZone } from 'luxon';
import { getTitleDetailsByUrl, TitleMainType } from 'movier';
import axios from 'axios';

// Initialize Keyv with SQLite storage.
const keyv = new Keyv('sqlite://src/db/db.sqlite', { table: 'cinesquad', namespace: 'cinesquad' });
// Handle connection errors for Keyv.
keyv.on('error', (err) => console.log('[keyv] Connection Error', err));

/**
 * Capitalises the first letter of each word in a string.
 * @param string - The string to be capitalised.
 * @returns The capitalised string.
 */
export function capitalise(string: string): string {
    return string.replace(/\S+/g, (word) => word.slice(0, 1).toUpperCase() + word.slice(1));
}

/**
 * Checks if a message is deletable, and deletes it after a specified amount of time.
 * @param message - The message to check.
 * @param time - The amount of time to wait before deleting the message, in milliseconds.
 * @returns void
 */
export function deletableCheck(message: Message, time: number): void {
    setTimeout(async () => {
        try {
            if (message && message.deletable) {
                await message.delete();
            }
        } catch (error) {
            // Do nothing with the error
        }
    }, time);
}

/**
 * Fetches the registered global application commands and returns an object
 * containing the command names as keys and their corresponding IDs as values.
 * @param client - The Discord Client instance.
 * @returns An object containing command names and their corresponding IDs.
 * If there are no commands or an error occurs, an empty object is returned.
 */
export async function getCommandIds(client: Client): Promise<{ [name: string]: string }> {
    try {
        // Fetch the registered global application commands
        const commands = await client.application?.commands.fetch();

        if (!commands) {
            return {};
        }

        // Create an object to store the command IDs
        const commandIds: { [name: string]: string } = {};

        commands.forEach((command) => {
            commandIds[command.name] = command.id;
            console.log(command);
        });

        return commandIds;
    } catch (error) {
        console.error('Error fetching global commands:', error);
        return {};
    }
}

/**
 * Returns the initialized Keyv instance for handling welcome messages.
 * @returns Keyv The initialized Keyv instance.
 */
export function KeyvInstance(): Keyv {
    return keyv;
}

/**
 * Set properties for a guild in Keyv.
 * @param guildId The ID of the guild.
 * @param data An object containing properties to be set.
 */
export async function setDb(guildId: string, data: Record<string, string>): Promise<void> {
    // Retrieve existing data from Keyv
    const existingData = (await keyv.get(guildId)) || {};

    // Update properties dynamically using Object.keys
    Object.keys(data).forEach((key) => {
        existingData[key] = data[key];
    });

    // Set the updated data back to Keyv
    await keyv.set(guildId, existingData);
}

/**
 * Delete a property for a guild in Keyv.
 * @param guildId The ID of the guild.
 * @param property The name of the property to be deleted.
 */
export async function deleteGuildProperty(guildId: string, property: string): Promise<void> {
    // Retrieve existing data from Keyv
    const existingData = (await keyv.get(guildId)) || {};

    // Delete the specified property
    delete existingData[property];

    // Set the updated data back to Keyv
    await keyv.set(guildId, existingData);
}

/**
 * Checks if a given string is a valid time zone.
 * Uses Luxon library to create an IANAZone object based on the provided time zone.
 * @param timezone - The time zone string to be validated.
 * @returns True if the time zone is valid, false otherwise.
 * @throws an error if Luxon fails to create an IANAZone object,
 * indicating that the provided time zone is invalid.
 */
export function isValidTimeZone(timezone: string): boolean {
    return IANAZone.isValidZone(timezone);
}

/**
 * Checks if the provided time is valid in the specified timezone.
 * @param time - The time to validate (e.g., "7:30PM" or "19:30PM").
 * @param timezone - The timezone to use for validation.
 * @param date - Optional date to pass
 * @returns  true if the time is valid in the specified timezone, otherwise false.
 */
export function isValidTime(time: string, timezone: string, date: string = ''): Date | null {
    // Use provided date or default to today's date
    const currentDate = date ? DateTime.fromFormat(date, 'dd/MM', { zone: timezone }) : DateTime.local().setZone(timezone);

    // Combine the date and time
    const dateTime = currentDate.set({
        hour: DateTime.fromFormat(time, 'h:mma').hour,
        minute: DateTime.fromFormat(time, 'h:mma').minute,
    });

    // Check if the DateTime object is valid
    return dateTime.isValid ? new Date(dateTime.toMillis()) : null;
}

/**
 * Fetches and returns details of content based on the provided URL.
 * @param url - The URL of the content.
 * @returns A promise that resolves to content details or undefined if the data is not available.
 */
export async function getContentDetails(url: string) {
    try {
        // Attempt to fetch the content data
        const data = await getTitleDetailsByUrl(url);

        if (!data) {
            console.error('Content is not available.');
            return undefined; // Return early if data is not available
        }

        const contentType = {
            [TitleMainType.Movie]: 'Movie',
            [TitleMainType.Series]: 'Series',
            [TitleMainType.SeriesEpisode]: 'Series Episode',
            [TitleMainType.TVSpecial]: 'TV Special',
            [TitleMainType.TVShort]: 'TV Short',
            [TitleMainType.TVMovie]: 'TV Movie',
            [TitleMainType.Video]: 'Video',
        };

        // Extract relevant details from the data
        return {
            title: data.name,
            year: data.titleYear,
            plot: data.plot,
            type: contentType[data.mainType],
            rating: data.mainRate.rate,
            totalVotes: data.mainRate.votesCount,
            cast: data.casts.slice(0, 3).map((cast) => cast.name).join(', '),
            genres: capitalise(data.genres.join(', ')),
            image: data.posterImage.url,
            runtime: data.runtime,
            url,
            id: data.mainSource.sourceId,
        };
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

/**
 * Fetches and returns fanart for content.
 * @param id - The IMDb ID of the content.
 * @param type - The type of content to fetch: 'movie' or 'show'.
 * @returns A promise that resolves to the URL of the fanart image, or undefined if the data is not available.
 */
export async function getFanartById(id: string, type: string): Promise<string | undefined> {
    if (!process.env.FanartKey) return '';

    try {
        const parseType = type === 'Movie' ? 'movies' : 'tv';

        // Fetch the artwork
        const response = await axios.get(`http://webservice.fanart.tv/v3/${parseType}/${id}?api_key=${process.env.FanartKey}`);

        if (!response.data) {
            console.error('Fanart data not available.');
            return undefined; // Return early if fanart is not available
        }

        let reqImage = '';

        // Determine the appropriate images based on the content type
        const posters = type === 'Movie' ? response.data.moviebackground : response.data.tvbackground;

        reqImage = posters.length > 0 ? posters[0].url : '';

        // Return the fanart image URL
        return reqImage;
    } catch (error) {
        console.error('Error fetching fanart:', error);
        return undefined;
    }
}
