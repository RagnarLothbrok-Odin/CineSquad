import type { ArgsOf } from 'discordx';
import { Discord, Once } from 'discordx';
import { GuildTextBasedChannel, PermissionsBitField } from 'discord.js';
import canvafy from 'canvafy';
import ordinal from 'ordinal';
import { deleteGuildProperty, KeyvInstance } from '../utils/Util.js';

/**
 * Discord.js GuildMemberAdd event handler.
 */
@Discord()
export class GuildMemberAdd {
    /**
     * Executes when the GuildMemberAdd event is emitted.
     * @param member
     * @param client - The Discord client.
     * @returns void
     */
    @Once({ event: 'guildMemberAdd' })
    async onGuildMemberAdd([member]: ArgsOf<'guildMemberAdd'>) {
        // Retrieve data for the current guild from Keyv
        const data = await KeyvInstance()
            .get(member.guild!.id);

        // Check if 'welcome' property exists in the data
        if (data && data.welcome) {
            // Retrieve the channel using the stored ID
            const channel = member.guild?.channels.cache.get(data.welcome) as GuildTextBasedChannel;

            // Check if the channel exists and the bot has SendMessages permission
            if (channel && channel.permissionsFor(channel.guild.members.me!).has(PermissionsBitField.Flags.SendMessages)) {
                const welcome = await new canvafy.WelcomeLeave()
                    .setAvatar(member.user.displayAvatarURL({
                        forceStatic: true,
                        extension: 'png',
                    }))
                    .setBackground('image', 'https://share.valhalladev.org/u/welcome.jpg')
                    .setTitle(`Welcome ${member.displayName}`)
                    .setDescription(`Welcome to CineSquad!\nYou are our ${ordinal(member.guild.memberCount - member.guild.members.cache.filter((m) => m.user.bot).size)} member!`)
                    .setBorder('#2a2e35')
                    .setAvatarBorder('#B03533')
                    .setOverlayOpacity(0.6)
                    .build();

                channel.send({
                    files: [{
                        attachment: welcome,
                        name: `welcome-${member.id}.png`,
                    }],
                });
            } else {
                // If the channel doesn't exist or bot lacks SendMessages permission, remove 'welcome' property
                await deleteGuildProperty(member.guild.id, 'welcome');
            }
        }

        if (data && data.autorole) {
            // Retrieve the role using the stored ID
            const role = member.guild.roles.cache.get(data.autorole);

            // Check if the role exists and the bot has ManageRoles permission
            if (role && member.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                // Attempt to assign the role to the member
                try {
                    await member.roles.add(role.id);
                } catch (e) {
                    console.error(e);
                }
            } else {
                // If the role doesn't exist or bot lacks ManageRoles permission, remove 'autorole' property
                await deleteGuildProperty(member.guild.id, 'autorole');
            }
        }
    }
}
