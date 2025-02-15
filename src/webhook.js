import axios from "axios";
import { logger, dayjs } from "./utils.js";

const createEmbed = (courseName, assessments) => {
  const embed = {
    title: courseName,
    color: 48028,
    timestamp: dayjs().toISOString(),
    thumbnail: {
      url: "https://1.bp.blogspot.com/-Z6P0kRFzZj0/YMtmsPxs93I/AAAAAAACvro/y1lPCxCPljwognc1IP3GQFOVfhdbxXi8wCLcBGAsYHQ/s600/cefet-mg-indagacao.png",
    },
    fields: [],
  };

  for (const { name, abbreviation, maxScore, score } of assessments) {
    const percentage = ((score / maxScore) * 100).toFixed(2);
    const value = `${score.toFixed(2)}/${maxScore.toFixed(2)} (${percentage}%)`;
    embed.fields.push({
      name: `${abbreviation} - ${name}`,
      value,
      inline: true,
    });
  }

  return embed;
};

export const sendWebhook = async (name, assessments) => {
  const embed = createEmbed(name, assessments);

  try {
    await axios.post(
      `https://discord.com/api/webhooks/${process.env.WEBHOOK_ID}/${process.env.WEBHOOK_TOKEN}`,
      {
        embeds: [embed],
      }
    );
  } catch (e) {
    logger.error("Failed to send webhook", e);
  }
};
