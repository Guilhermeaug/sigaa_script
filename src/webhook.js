import chalk from "chalk";
import axios from "axios";

const createEmbed = (courseName, grades) => {
  const embed = {
    title: courseName,
    color: 48028,
    timestamp: new Date().toISOString(),
    thumbnail: {
      url: "https://1.bp.blogspot.com/-Z6P0kRFzZj0/YMtmsPxs93I/AAAAAAACvro/y1lPCxCPljwognc1IP3GQFOVfhdbxXi8wCLcBGAsYHQ/s600/cefet-mg-indagacao.png",
    },
    image: {
      url: "https://glitchii.github.io/embedbuilder/assets/media/banner.png",
    },
    fields: [],
  };
  for (const [key, value] of Object.entries(grades)) {
    embed.fields.push({ name: key, value: `> ${value}`, inline: false });
  }
  return embed;
};

export const sendWebhook = async (name, grades) => {
  const embed = createEmbed(name, grades);

  try {
    await axios.post(
      `https://discord.com/api/webhooks/${process.env.WEBHOOK_ID}/${process.env.WEBHOOK_TOKEN}`,
      {
        embeds: [embed],
      }
    );
  } catch (e) {
    console.log(chalk.red("Error sending webhook"));
    console.error(e);
  }
};
