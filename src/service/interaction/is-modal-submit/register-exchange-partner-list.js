import { userMention } from 'discord.js';
import ExchangePartner from '../../../models/ExchangePartner.js';

export default async (interaction) => {
  const targetLanguage = interaction.fields.getTextInputValue('targetLanguage');
  const offerLanguage = interaction.fields.getTextInputValue('offerLanguage');
  const introduction = interaction.fields.getTextInputValue('introduction');

  // filter if it is not flag emoji char 🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇱 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿

  const refinedTargetLanguage = targetLanguage.replace(
    // eslint-disable-next-line no-misleading-character-class
    /[^🇦🇧🇨🇩🇪🇫🇬🇭🇮🇯🇰🇱🇲🇳🇴🇵🇶🇷🇸🇹🇺🇻🇼🇽🇾🇿]/gu,
    '',
  );

  const refinedOfferLanguage = offerLanguage.replace(
    // eslint-disable-next-line no-misleading-character-class
    /[^🇦🇧🇨🇩🇪🇫🇬🇭🇮🇯🇰🇱🇲🇳🇴🇵🇶🇷🇸🇹🇺🇻🇼🇽🇾🇿]/gu,
    '',
  );

  // check if targetLanguage is valid flag emoji
  if (refinedTargetLanguage.length % 4 !== 0) {
    await interaction.reply({
      content: 'Please enter a valid target language.',
      ephemeral: true,
    });
    return;
  }

  // check if offerLanguage is valid flag emoji
  if (refinedOfferLanguage.length % 4 !== 0) {
    await interaction.reply({
      content: 'Please enter a valid offer language.',
      ephemeral: true,
    });
    return;
  }

  const exchangePartner = await ExchangePartner.findOne({
    where: {
      id: interaction.member.user.id,
    },
  });

  if (exchangePartner) {
    await ExchangePartner.update(
      {
        targetLanguage: refinedTargetLanguage,
        offerLanguage: refinedOfferLanguage,
        introduction,
      },
      {
        where: {
          id: interaction.member.user.id,
        },
      },
    );
  } else {
    await ExchangePartner.create({
      id: interaction.member.user.id,
      targetLanguage: refinedTargetLanguage,
      offerLanguage: refinedOfferLanguage,
      introduction,
    });
  }

  const content = `${userMention(
    interaction.member.user.id,
  )} registered language exchange partner list.\nTarget language: ${refinedTargetLanguage}\nOffer language: ${refinedOfferLanguage}\nIntroduction: ${introduction}`;

  await interaction.reply({
    embeds: [
      {
        color: 0x65a69e,
        title: 'Register LanguageExchange Partner List',
        description: content,
      },
    ],
  });
};
