import { Chance } from 'chance';
import config from '../../config/index.js';
import { COLORS } from '../../constants/index.js';
import emojiList from '../../data/emojis.js';
import Point from '../../models/point.js';

const { CLIENT_ID: clientId } = config;

const generateRandomThreeUniqueEmoji = () => {
  const emojiSet = new Set();
  const oneToThree = Chance().weighted([1, 2, 3], [10, 20, 70]);

  while (emojiSet.size < oneToThree) {
    const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    emojiSet.add(randomEmoji);
  }
  return [...emojiSet].join('');
};

export default async (message) => {
  try {
    const messages = await message.channel.messages.fetch({ limit: 10 });

    const lastBotMessage = messages.find(
      (msg) => msg.author.id === clientId && msg?.embeds[0]?.description?.length <= 9,
    );

    const sendNextEmojis = () => {
      message.channel.send({
        embeds: [
          {
            color: COLORS.PRIMARY,
            description: generateRandomThreeUniqueEmoji(),
          },
        ],
      });
    };

    if (!lastBotMessage || messages.last() === lastBotMessage) {
      await message.channel.send({
        embeds: [
          {
            color: COLORS.PRIMARY,
            description:
              'Please send a proper message that includes the emojis to continue the game.',
          },
        ],
      });

      sendNextEmojis();
      return;
    }

    const lastBotMessageContent = lastBotMessage.embeds[0].description;
    const currentMessageContent = message.content;

    const lastBotMessageContentArray = [...lastBotMessageContent];
    const currentMessageContentArray = [...currentMessageContent];
    const isMessageIncludesEmoji = lastBotMessageContentArray
      // filter 'U+fe0f'
      .filter((emoji) => emoji !== '️')
      .every((emoji) => currentMessageContentArray.includes(emoji));

    if (isMessageIncludesEmoji) {
      await message.react('✅').catch(() => {});

      const messageAuthorId = message.author.id;

      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      const emojiCount = [...segmenter.segment(lastBotMessageContent)].length;

      const basePoints = emojiCount * 5;
      const messageBonus = Math.floor(currentMessageContentArray.length / 10);
      const totalPoints = basePoints + messageBonus;

      await Point.updateOne(
        { id: messageAuthorId },
        { $inc: { emojiBlend: totalPoints } },
        { upsert: true },
      );

      await message.channel.send({
        embeds: [
          {
            color: COLORS.PRIMARY,
            footer: {
              icon_url: message.author.avatarURL(),
              text: `${message.author.globalName}(${message.author.username}#${message.author.discriminator}) earned ${totalPoints} point(s).`,
            },
          },
        ],
      });

      await message.channel.send('_ _');

      sendNextEmojis();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
