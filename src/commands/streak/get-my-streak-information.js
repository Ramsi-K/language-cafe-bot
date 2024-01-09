import { SlashCommandBuilder, bold, time } from 'discord.js';
import { studyCheckInKeyv } from '../../db/keyvInstances.js';
import channelLog, {
  generateInteractionCreateLogContent,
} from '../../service/utils/channel-log.js';

export default {
  data: new SlashCommandBuilder()
    .setName('get-my-streak-information')
    .setDescription('Get your streak information.'),
  async execute(interaction) {
    channelLog(generateInteractionCreateLogContent(interaction));

    const userObject = await studyCheckInKeyv.get('user');
    const propertyNames = Object.keys(userObject);

    const havePointsPropertyNames = propertyNames.filter((key) => userObject[key].point > 0);

    const userList = havePointsPropertyNames.map((key) => ({
      id: key,
      point: userObject[key].point,
      lastAttendanceTimestamp: userObject[key].lastAttendanceTimestamp,
      expiredTimestamp: userObject[key].expiredTimestamp,
      highestPoint: userObject[key].highestPoint || 0,
      freezePoint: userObject[key].freezePoint || 0,
    }));

    const currentTimestamp = Date.now();

    const calculatedUserList = userList
      .map((user) => {
        if (user.expiredTimestamp < currentTimestamp) {
          const differenceDays = Math.ceil(
            (currentTimestamp - user.expiredTimestamp) / (1000 * 60 * 60 * 24),
          );

          const freezePoint = user.freezePoint - differenceDays;

          if (freezePoint < 0) {
            return {
              ...user,
              point: 0,
              freezePoint: 0,
            };
          }
        }

        return user;
      })
      .filter((user) => user.point > 0);

    const pointRankedUserList = [...calculatedUserList].sort(
      (a, b) =>
        Number(b.point) - Number(a.point) ||
        Number(b.lastAttendanceTimestamp) - Number(a.lastAttendanceTimestamp),
    );

    const heighestPointRankedUserList = [...calculatedUserList].sort(
      (a, b) =>
        Number(b.highestPoint) - Number(a.highestPoint) ||
        Number(b.lastAttendanceTimestamp) - Number(a.lastAttendanceTimestamp),
    );

    const currentUser = calculatedUserList.find((user) => user.id === interaction.user.id);

    const pointRank = pointRankedUserList.indexOf(currentUser) + 1;
    const highestPointRank = heighestPointRankedUserList.indexOf(currentUser) + 1;

    let content = '';

    if (currentUser) {
      content += `### Streak Information\n\nStreak point: ${bold(currentUser.point)}  (Rank: ${bold(
        `#${pointRank}`,
      )})\nHighest streak point: ${bold(currentUser.highestPoint)} (Rank: ${bold(
        `#${highestPointRank}`,
      )})\n\nFreeze point: ${bold(currentUser.freezePoint)}\n\nLast check in: ${time(
        +currentUser.lastAttendanceTimestamp.toString().slice(0, 10),
        'F',
      )}\nExpired date: ${time(+currentUser.expiredTimestamp.toString().slice(0, 10), 'F')}`;
    } else {
      content += '### Streak Information\n\nYou have no streak.';
    }

    await interaction.reply({
      embeds: [
        {
          color: 0x65a69e,
          description: content,
          thumbnail: {
            url: interaction.user.displayAvatarURL(),
          },
        },
      ],
      ephemeral: true,
    });
  },
};
