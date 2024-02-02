import type { Message } from 'discord.js';
import { Client } from 'discordx';
import 'colors';
import Keyv from 'keyv';
import { IANAZone } from 'luxon';
import { getTitleDetailsByUrl } from 'movier';

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
 * Validates if the provided string is a valid IMDb URL.
 * @param imdbField The IMDb URL to validate.
 * @returns true if the IMDb URL is valid, otherwise false.
 */
export function isValidIMDbURL(imdbField: string): boolean {
    const imdbRegexPattern = /^(https?:\/\/)?(www\.|m\.)?imdb\.com\/title\/tt\d+\/?$/i;
    return imdbRegexPattern.test(imdbField);
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

        // Extract relevant details from the data
        return {
            title: data.name,
            year: data.titleYear,
            plot: data.plot,
        };
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
