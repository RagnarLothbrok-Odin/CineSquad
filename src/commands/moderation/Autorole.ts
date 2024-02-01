import { Discord, Slash, SlashOption } from 'discordx';
import {
    ApplicationCommandOptionType, CommandInteraction, GuildMemberRoleManager, PermissionsBitField, Role,
} from 'discord.js';
import { Category } from '@discordx/utilities';
import { setDb } from '../../utils/Util.js';

@Discord()
@Category('Staff')
export class Autorole {
    /**
     * Set the role members will be given upon joining
     * @param role - Role to assign new members
     * @param interaction - The command interaction.
     */
    @Slash({
        description: 'Set the role users will be given upon joining',
        defaultMemberPermissions: [PermissionsBitField.Flags.ManageRoles],
    })
    async autorole(
        @SlashOption({
            description: 'The role users will be given upon joining',
            name: 'role',
            required: true,
            type: ApplicationCommandOptionType.Role,
        })
            role: Role,
            interaction: CommandInteraction,
    ) {
        // Check if the bot has the ManageRoles permission
        if (!interaction.guild!.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({
                content: 'I am missing the `ManageRoles` permission.\nPlease grant me this permission and try running the command again.',
            });
        }

        // If the role is higher than the bot highest role
        if (role.position >= interaction.guild!.members.me.roles.highest.position) {
            return interaction.reply({
                content: 'The specified role exceeds my highest role.',
            });
        }

        // If the role is higher than the command executor's highest role
        if (role.position >= (interaction.member!.roles as GuildMemberRoleManager).highest.position) {
            return interaction.reply({
                content: 'The specified role exceeds your highest role.',
            });
        }

        // Save the role members will be given upon joining
        await setDb(interaction.guild!.id, { autorole: role.id });

        // Send a confirmation message about the updated autorole
        await interaction.reply({
            content: `Ne members will now automatically be given ${role}.`,
        });
    }
}
