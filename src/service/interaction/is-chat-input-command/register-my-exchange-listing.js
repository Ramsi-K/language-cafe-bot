import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import ExchangePartner from '../../../models/ExchangePartner.js';

export default async (interaction) => {
  const exchangePartner = await ExchangePartner.findOne({
    where: {
      id: interaction.member.user.id,
    },
  });

  const modal = new ModalBuilder()
    .setCustomId('register-my-exchange-listing')
    .setTitle('Register exchange partner listing');

  const targetLanguage = new TextInputBuilder()
    .setCustomId('targetLanguage')
    .setLabel('Put target languages')
    .setPlaceholder('ex: Korean, Japanese (Put comma to separate languages)')
    .setValue(exchangePartner?.targetLanguage || '')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100);

  const offeredLanguage = new TextInputBuilder()
    .setCustomId('offeredLanguage')
    .setLabel('Put offered languages')
    .setPlaceholder('ex: English, Spanish (Put comma to separate languages)')
    .setValue(exchangePartner?.offeredLanguage || '')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100);

  const introduction = new TextInputBuilder()
    .setCustomId('introduction')
    .setLabel('Put your introduction.')
    .setPlaceholder(
      'About you, Partner (traits), Time (hours/week), Communication method (voice calls, texting, etc.)',
    )
    .setValue(exchangePartner?.introduction || '')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(targetLanguage),
    new ActionRowBuilder().addComponents(offeredLanguage),
    new ActionRowBuilder().addComponents(introduction),
  );

  await interaction.showModal(modal);
};
