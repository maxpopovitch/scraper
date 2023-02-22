// node ebanoe.js

const customParseFormat = require('dayjs/plugin/customParseFormat');
const dayjs = require('dayjs');
require('dayjs/locale/ru');
const fs = require('fs');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');

dayjs.extend(customParseFormat);

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

puppeteer
  .launch({ headless: false })
  .then(async browser => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('https://ebanoe.it');

    await page.waitForTimeout(5000);

    const humanVerificationIframeSelector = '#challenge-stage iframe';
    const humanVerificationButtonSelector = '#challenge-stage input[type="button"]';

    let humanVerificationElement;

    try {
      const humanVerificationIframe = await page.waitForSelector(humanVerificationIframeSelector, { timeout: 5000 });

      humanVerificationElement = await (await humanVerificationIframe.contentFrame()).waitForSelector('#cf-stage label.ctp-checkbox-label');
    } catch (error) {
      humanVerificationElement = await page.waitForSelector(humanVerificationButtonSelector);
    }

    await humanVerificationElement?.click?.();

    await page.waitForTimeout(5000);

    const html = await page.content();
    const $ = cheerio.load(html);

    const resultItemSelector = '.posts_group .post-item';
    const data = [];

    $(resultItemSelector)
      .each(async (i, elem) => {
        const title = $(elem).find('.post-title .entry-title a')?.text().trim();
        const teaser = $(elem).find('.post-excerpt .before-more')?.text().trim();
        const author = $(elem).find('.post-head .post-author .fn a')?.text().trim();
        const date = $(elem).find('.post-head .date .post-date:nth-of-type(1)')?.text().trim();
        const time = $(elem).find('.post-head .date .post-date:nth-of-type(3)')?.text().trim();

        data.push({
          title,
          teaser,
          author,
          created: dayjs(`${date} ${time}`, 'DD.MM.YYYY HH:mm', 'ru', true).valueOf(),
        });
      });

    fs.writeFileSync('ebanoe.json', JSON.stringify(data, null, 4));
    await browser.close();
  });
