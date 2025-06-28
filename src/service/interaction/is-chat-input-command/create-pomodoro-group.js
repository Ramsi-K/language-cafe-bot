import { userMention } from 'discord.js';
import schedule from 'node-schedule';
import client from '../../../client/index.js';
import { COLORS } from '../../../constants/index.js';
import PomodoroGroup from '../../../models/pomodoro-group.js';

export const finishedPomodoro = async ({ groupName, channel }) => {
  global?.pomodoro[groupName]?.forEach((job) => {
    job.cancel();
  });
  delete global?.pomodoro[groupName];
  await PomodoroGroup.deleteOne({ name: groupName });
  await channel.send({
    embeds: [
      {
        color: COLORS.PRIMARY,
        description: `The pomodoro study group \`${groupName}\` has now finished and will be deleted.`,
      },
    ],
  });
};

export const putPomodoroScheduleJob = async ({
  groupName,
  timeOption,
  startTimeStamp,
  channelId,
}) => {
  if (!global.pomodoro) {
    global.pomodoro = {};
  }

  const pomodoroInstance = global.pomodoro;

  const channel = await client.channels.fetch(channelId);

  const calculatedTimeOption = timeOption.reduce((pre, cur, index) => {
    pre.push((index > 0 ? pre[index - 1] : 0) + +cur);
    return pre;
  }, []);

  pomodoroInstance[groupName] = calculatedTimeOption
    .map((time, index) => {
      if (startTimeStamp + 1000 * 60 * time < Date.now()) {
        return null;
      }

      return schedule.scheduleJob(new Date(startTimeStamp + 1000 * 60 * time), async () => {
        const currentStatus = index % 2 === 0 ? 'break' : 'study';
        const previousStatus = index % 2 === 0 ? 'study' : 'break';
        const pomodoroGroupRes = await PomodoroGroup.findOne({ name: groupName });
        const users = pomodoroGroupRes.members;

        if (users.length === 0) {
          await channel.send({
            embeds: [
              {
                color: COLORS.PRIMARY,
                description: `There is no one in the pomodoro study group \`${groupName}\`.`,
              },
            ],
          });
          return;
        }

        if (index !== calculatedTimeOption.length - 1) {
          await channel.send(
            `<@${users.join('>, <@')}>, it's time for **${currentStatus}** ${`(${
              calculatedTimeOption[index + 1] - time
            } minutes).`}`,
          );

          const description = `### ${groupName}\n\n${calculatedTimeOption
            .map(
              (e, i) =>
                `${i % 2 === 0 ? 'Study' : 'Break'}: \`${timeOption[i]} min\`${
                  i === index + 1
                    ? ` (ends <t:${Math.floor(startTimeStamp / 1000) + e * 60}:R>) ←`
                    : ''
                }`,
            )
            .join('\n')}`;

          const fields = [
            {
              name: 'Members',
              value: `<@${users.join('>, <@')}>`,
            },
          ];

          await channel.send({
            embeds: [
              {
                color: COLORS.PRIMARY,
                description,
                fields,
              },
            ],
          });
        } else {
          await channel.send(`<@${users.join('>, <@')}>, **${previousStatus}** time is over.`);
        }

        if (index === calculatedTimeOption.length - 1) {
          finishedPomodoro({
            groupName,
            channel,
          });
        }
      });
    })
    .filter((e) => e);

  if (pomodoroInstance[groupName].length === 0) {
    finishedPomodoro({
      groupName,
      channel,
    });
  }
};

export default async (interaction) => {
  await interaction.deferReply({
    ephemeral: true,
  });
  const channelId = interaction.channel.id;
  const groupName = interaction.options.getString('group-name');
  const timerPattern = interaction.options.getString('timer-pattern');

  const timeOption = timerPattern.split('/');

  if (!timeOption.every((e) => !Number.isNaN(+e) && +e > 0)) {
    await interaction.editReply({
      embeds: [
        {
          color: COLORS.PRIMARY,
          description: 'Timer pattern is not valid.',
        },
      ],
      ephemeral: true,
    });
    return;
  }

  if (timeOption.some((e) => +e > 100 || +e < 1)) {
    await interaction.editReply({
      embeds: [
        {
          color: COLORS.PRIMARY,
          description: 'Each time option should be more than 1 minute and less than 100 minutes.',
        },
      ],
      ephemeral: true,
    });
    return;
  }

  const pomodoroGroupRes = await PomodoroGroup.find();

  const members = pomodoroGroupRes.map((group) => group.members).flat();

  if (members.includes(interaction.user.id)) {
    await interaction.editReply({
      embeds: [
        {
          color: COLORS.PRIMARY,
          description: 'You are already in a pomodoro group.',
        },
      ],
      ephemeral: true,
    });

    return;
  }

  if (pomodoroGroupRes.some((group) => group.name === groupName)) {
    await interaction.editReply({
      embeds: [
        {
          color: COLORS.PRIMARY,
          description: `A group with the name \`${groupName}\` already exists.`,
        },
      ],
      ephemeral: true,
    });

    return;
  }

  const nowTimeStamp = Date.now();

  const res = await PomodoroGroup.create({
    name: groupName,
    timeOption,
    startTimeStamp: nowTimeStamp,
    members: [interaction.user.id],
    channelId,
  });

  if (!res) {
    await interaction.editReply({
      embeds: [
        {
          color: COLORS.PRIMARY,
          description: 'Failed to create a new group.',
        },
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deleteReply();

  await interaction.channel.send({
    embeds: [
      {
        color: COLORS.PRIMARY,
        description: `${userMention(interaction.user.id)} created a new pomodoro study group.`,
        fields: [
          {
            name: 'Group Name',
            value: `\`${groupName}\``,
            inline: true,
          },
          {
            name: 'Timer Pattern',
            value: `\`${timerPattern}\``,
            inline: true,
          },
        ],
      },
    ],
  });

  await interaction.channel.send(
    `<@${interaction.user.id}>, it's time for **study** (${timeOption[0]} minutes).`,
  );

  const calculatedTimeOption = timeOption.reduce((pre, cur, index) => {
    pre.push((index > 0 ? pre[index - 1] : 0) + +cur);
    return pre;
  }, []);

  const description = `### ${groupName}\n\n${calculatedTimeOption
    .map(
      (e, i) =>
        `${i % 2 === 0 ? 'Study' : 'Break'}: \`${timeOption[i]} min\`${
          i === 0 ? ` (ends <t:${Math.floor(nowTimeStamp / 1000) + e * 60}:R>) ←` : ''
        }`,
    )
    .join('\n')}`;

  const fields = [
    {
      name: 'Members',
      value: `<@${interaction.user.id}>`,
    },
  ];

  await interaction.channel.send({
    embeds: [
      {
        color: COLORS.PRIMARY,
        description,
        fields,
      },
    ],
  });

  putPomodoroScheduleJob({
    groupName,
    timeOption,
    startTimeStamp: nowTimeStamp,
    channelId,
  });
};
