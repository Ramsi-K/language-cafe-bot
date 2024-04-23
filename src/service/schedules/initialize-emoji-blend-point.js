import EmojiBlend from '../../models/emoji-blend.js';
import config from '../../config/index.js';
import client from '../../client/index.js';

const { EMOJI_BLEND_CHANNEL_ID: emojiBlendChannelId } = config;

const initializeEmojiBlendPoint = async () => {
  try {
    const emojiBlend = await EmojiBlend.find().sort({ point: -1 }).limit(1);

    const dbUser = emojiBlend[0];

    const user = await client.users.fetch(emojiBlend[0].id);

    const content = `### This month, Emoji-Blend's result\nThe winner is ${`<@${dbUser.id}>`} with ${
      dbUser.point
    } points!`;

    const channel = await client.channels.fetch(emojiBlendChannelId);
    await channel.send({
      embeds: [
        {
          color: 0x65a69e,
          description: content,
          thumbnail: {
            url: user.avatarURL(),
          },
        },
      ],
    });

    await EmojiBlend.deleteMany({});
  } catch (error) {
    console.error(error);
  }
};

export default initializeEmojiBlendPoint;
