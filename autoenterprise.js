// node autoenterprise.js "email@email.com password"

import fs from 'fs';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

import periods from './periods.js';

let email = '';
let password = '';

const request = process.argv[2];
if (!request) {
  const credentials = await import('./autoenterprise-creds.js');
  email = credentials.email;
  password = credentials.password;
} else {
  [email, password] = request.split(' ')
}

async function run () {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('https://charge.autoenterprise.com.ua/');

  const formSelector = '.tab-content #login form';
  const emailSelector = `${formSelector} #email`;
  const passwordSelector = `${formSelector} #password`;
  const submitBtnSelector = `${formSelector} [type="submit"]`;

  await page.waitForSelector(emailSelector);
  await page.click(emailSelector);
  await page.keyboard.type(email);
  await page.waitForSelector(passwordSelector);
  await page.click(passwordSelector);
  await page.keyboard.type(password);
  await page.click(submitBtnSelector);

  const statsLinkSelector = 'a[href="https://charge.autoenterprise.com.ua/?page=index"]';

  await page.waitForSelector(statsLinkSelector);
  await page.click(statsLinkSelector);

  const projectDropdownSelector = 'select#project + .select2-container';
  await page.waitForSelector(projectDropdownSelector);
  await page.click(projectDropdownSelector);

  const projectSelector = '#select2-project-results [id^="select2-project-result"][id$="413"]';
  await page.waitForSelector(projectSelector);
  await page.click(projectSelector);

  await page.waitForTimeout(1000);

  const evStationsDropdownSelector = 'select#device + .select2-container';
  await page.waitForSelector(evStationsDropdownSelector);

  const html = await page.content();
  const $ = cheerio.load(html);

  const evChargersListSelector = 'ul#select2-device-results';
  const statsDateFromSelector = 'input[name="date_from"]';
  const statsDateToSelector = 'input[name="date_to"]';
  const statsSubmitBtnSelector = '[type="submit"]';

  const dataTableSelector = '[id^="DataTables"]';
  const kWtTotalSelector = `${dataTableSelector} tbody tr.group[data-id="1"] td:nth-of-type(9)`;

  const commonDataFolder = 'data';
  const currentDataFolder = `${commonDataFolder}/autoenterprise`;

  if (!fs.existsSync(commonDataFolder)){
    fs.mkdirSync(commonDataFolder);
  }

  if (!fs.existsSync(currentDataFolder)){
    fs.mkdirSync(currentDataFolder);
  }

  let filePath;

  let data;

  for (const period of periods) {
    const [year, month] = period.split('-');
    data = [];

    filePath = `data/autoenterprise/${period}.json`;

    if (fs.existsSync(filePath)) {
      continue;
    }

    const evChargers = ['2977', '2975', '3922', '3921'];

    for (const evCharger of evChargers) {
      await page.click(evStationsDropdownSelector);
      const evChargerId = await page.evaluate((selector, evChargerNumber) => {
        const elements = [...document.querySelectorAll(`${selector} li`)];
        const array = elements.map(element => element.innerHTML.trim().startsWith(`№${evChargerNumber}`) ? element.id : '');
        return array.find(Boolean);
      }, evChargersListSelector, evCharger);

      const evChargerSelector = `#${evChargerId}`;

      await page.waitForSelector(evChargerSelector);
      await page.click(evChargerSelector);
      await page.waitForSelector(statsDateFromSelector);
      await page.click(statsDateFromSelector);
      await page.evaluate( (selector) => (document.querySelector(selector).value = ''), statsDateFromSelector);

      const dateFrom = `01.${month}.${year} 00:00:00`;
      await page.keyboard.type(dateFrom);

      await page.waitForSelector(statsDateToSelector);
      await page.click(statsDateToSelector);
      await page.evaluate( (selector) => (document.querySelector(selector).value = ''), statsDateToSelector);

      const dateTo = `${new Date(+year, +month, 0).getDate()}.${month}.${year} 23:59:59`;
      await page.keyboard.type(dateTo);
      await page.waitForSelector(statsSubmitBtnSelector);
      await page.click(statsSubmitBtnSelector);

      await page.waitForSelector(dataTableSelector);

      try {
        const value = await (await (await page.waitForSelector(kWtTotalSelector, { timeout: 100 })).getProperty('textContent')).jsonValue();
        data.push({ [evCharger]: value });
      } catch (error) {
        data.push({ [evCharger]: null });
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
  }
  await browser.close();
}

run();
