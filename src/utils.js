import "dayjs/locale/pt-br.js";
import dayjs from "dayjs";
import chalk from "chalk";

dayjs.locale("pt-br");

const timestamp = () => dayjs().format("DD/MM/YYYY HH:mm:ss");

export const logger = {
  info: (...args) => {
    const timestampStr = timestamp();
    const blueTimestamp = chalk.blueBright(`[${timestampStr}]`);
    console.log(blueTimestamp, ...args);
  },
  error: (...args) => {
    const timestampStr = timestamp();
    const redTimestamp = chalk.redBright(`[${timestampStr}]`);
    console.error(redTimestamp, ...args);
  },
};

export { dayjs };
