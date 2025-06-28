import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../../constants/index.js';
import MatchMatchTopic from '../../models/match-match-topic.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('get-match-match-topics')
    .setDescription('Get match-match topics')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      channelLog(generateInteractionCreateLogContent(interaction));

      const matchMatchTopics = await MatchMatchTopic.find().sort({ createdAt: 1 });

      const description = matchMatchTopics
        .map((matchMatchTopic) => matchMatchTopic.topic)
        .join('\n\n');

      await interaction.reply({
        embeds: [
          {
            color: COLORS.PRIMARY,
            title: 'Match-match Topics',
            description: `\`\`\`\n${description}\n\`\`\``,
          },
        ],
        ephemeral: true,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  },
};
