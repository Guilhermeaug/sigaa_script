import deepEqual from "deep-equal";
import { config } from "dotenv";
import { cache } from "./cache.js";
import { getClasses, getGrades } from "./grades.js";
import { Scraper } from "./scraper.js";
import { logger } from "./utils.js";
import { sendWebhook } from "./webhook.js";

config();

logger.info("Starting Service");
const run = async () => {
  await new Scraper().scrape().then(async (scraper) => {
    const classes = await getClasses(scraper);
    const grades = await getGrades(scraper, classes);

    for (const { course, assessments } of grades) {
      const previousGrades = await cache.get(course);
      if (!deepEqual(previousGrades, assessments)) {
        logger.info("Found new grades", course);

        const setCachePromise = cache.set(course, assessments);
        const sendWebhookPromise = sendWebhook(course, assessments);
        await Promise.all([setCachePromise, sendWebhookPromise]);
      }
    }
  });

  logger.info("Service finished");
};
await run();
