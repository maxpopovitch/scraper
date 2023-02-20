// node stackoverflow.js

const customParseFormat = require('dayjs/plugin/customParseFormat');
const dayjs = require('dayjs');
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
    await page.goto('https://stackoverflow.com/users/login?ssrc=head&returnurl=https%3a%2f%2fstackoverflow.com%2f');

    const emailSelector = '#email';
    const passwordSelector = '#password';
    const signInBtnSelector = '#submit-button';

    await page.waitForSelector(emailSelector);
    await page.click(emailSelector);
    await page.keyboard.type('dou.ginney@gmail.com');
    await page.waitForSelector(passwordSelector);
    await page.click(passwordSelector);
    await page.keyboard.type('qWeR123!@#');
    await page.click('#formContainer');
    await page.click(signInBtnSelector);

    await page.waitForTimeout(5000);

    const html = await page.content();
    const $ = cheerio.load(html);

    const resultItemSelector = '#question-mini-list [id^="question-summary"]';
    const data = [];

    $(resultItemSelector)
      .each(async (i, elem) => {
        const title = $(elem).find('.s-post-summary--content-title a')?.text().trim();

          const tags = [];
          $(elem).find('.s-post-summary--meta-tags').find('.post-tag').each(function (index, element) {
              console.log('element', $(element)?.text().trim());
              tags.push($(element)?.text().trim());
          });

        const authorUsername = $(elem).find('.s-user-card--link a')?.text().trim();
        const authorProfileLink = $(elem).find('.s-user-card--link a').attr('href');
        const authorAvatar = $(elem).find('.s-user-card .s-avatar .s-avatar--image').attr('src');
        const datetime = $(elem).find('.s-user-card--time .relativetime').attr('title');

        data.push({
          title,
          tags,
          author: {
            username: authorUsername,
            link: authorProfileLink,
            avatar: authorAvatar,
          },
          created: dayjs(`$${datetime}`, 'YYYY-MM-DD HH:mm:ssZ').valueOf(),
        });
      });

    fs.writeFileSync('stackoverflow.json', JSON.stringify(data, null, 4));
    await browser.close();
  });
