// node linkedin.js "john doe"

import fs from 'fs';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const request = process.argv[2];
if (!request) {
  throw 'Please provide REQUEST as a first argument';
}

async function run () {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('https://linkedin.com');

  const usernameSelector = '[autocomplete="username"]';
  const passwordSelector = '[autocomplete="current-password"]';
  const signInBtnSelector = '[data-id="sign-in-form__submit-btn"]';

  await page.waitForSelector(usernameSelector);
  await page.click(usernameSelector);
  await page.keyboard.type('dou.ginney@gmail.com');
  await page.waitForSelector(passwordSelector);
  await page.click(passwordSelector);
  await page.keyboard.type('qWeR123!@#');
  await page.click(signInBtnSelector);

  await page.waitForTimeout(10000);

  const searchInputSelector = '#global-nav-typeahead input.search-global-typeahead__input';

  await page.waitForSelector(searchInputSelector);
  await page.click(searchInputSelector);
  await page.keyboard.type(request);
  await page.keyboard.press('Enter');

  await page.waitForTimeout(5000);

  const html = await page.content();
  const $ = cheerio.load(html);

  const resultItemSelector = '.search-results-container .reusable-search__entity-result-list .reusable-search__result-container';
  const data = [];

  $(resultItemSelector).each(async (i, elem) => {
    const name = $(elem).find('.app-aware-link [aria-hidden="true"]')?.text().trim();
    const title = $(elem).find('.entity-result__primary-subtitle')?.text().trim();
    const location = $(elem).find('.entity-result__secondary-subtitle')?.text().trim();

    data.push({
      name,
      title,
      location,
    });
  });

  if (!fs.existsSync('data')){
    fs.mkdirSync('data');
  }

  fs.writeFileSync('data/linkedin.json', JSON.stringify(data, null, 4));
  await browser.close();
}

run();
