import {WebDriver, Builder, By, ThenableWebDriver, WebElement} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import chalk from 'chalk';
import fs, {WriteStream} from 'fs';
import {DEBUG} from './src/constants/DEBUG';
import {getText} from './src/functions/getText';
import {print} from './src/functions/print';
import {write} from './src/functions/write';
import {Post} from './src/interfaces/Post';

async function getSalary(driver: WebDriver, post: Post, postSelector: string): Promise<void> {
    post.salary = null;
    const salarySelector: string = `${postSelector} > div > span[class="Tag Tag--success Tag--small Tag--subtle"]`;
    try {
        post.salary = await getText(driver, salarySelector);
    } catch (e) {
        // this stays empty
    }
}

async function getTags(driver: WebDriver, post: Post, postSelector: string): Promise<void> {
    post.tags = [];
    let tag: {no?: number, selector?: string, text?: string} = {};
    tag.no = 1;
    while (true) {
        tag.selector = `${postSelector} > div > span[class="Tag Tag--neutral Tag--small Tag--subtle"]:nth-of-type(${tag.no})`;
        try {
            tag.text = await getText(driver, tag.selector);
            if (tag.text) {
                post.tags.push(tag.text);
                tag.no++;
            }
        } catch(e) {
            break;
        }
    }
}

(async(): Promise<void> => {
    const writeStream: WriteStream = fs.createWriteStream('job-posts.json', { flags: 'w' });
    writeStream.write('[\n');
    let firstPost: boolean = true;

    const options = new chrome.Options();
    options.headless();

    const driver: ThenableWebDriver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    console.log();

    await driver.get('https://www.jobs.cz/prace/');
    await driver.sleep(1000);

    const post: Post = {};
    const nextPageSelector: string = 'html > body > div nav > ul > li:last-of-type > a.Button.Button--secondary.Button--square.Pagination__button--next';
    let postNo: number = 1;
    let pageNo: number = 1;

    while (true) {
        const postSelector: string = `div article:nth-of-type(${postNo})`;
        try {
            await driver.wait(async(): Promise<WebElement> => await driver.findElement(By.css(postSelector)), 1000);
        } catch (e) {
            try {
                await driver.findElement(By.css(nextPageSelector)).click();
                postNo = 1;
                pageNo++;
                if (DEBUG) {
                    console.log(chalk.bold(chalk.yellow(`- clicked next page (${pageNo}) -`)));
                    console.log();
                }
                continue;
            } catch (e) {
                break;
            }
        }
        const titleSelector: string = `${postSelector} > header > h2 > a`;
        const companySelector: string = `${postSelector} > footer > ul > li:nth-of-type(1) > span`;
        const locationSelector: string = `${postSelector} > footer > ul > li:nth-of-type(2)`;

        post.title = await getText(driver, titleSelector);
        post.url = await driver.findElement(By.css(titleSelector)).getAttribute('href');
        await getSalary(driver, post, postSelector);
        await getTags(driver, post, postSelector);
        post.company = await getText(driver, companySelector);
        post.location = await getText(driver, locationSelector);

        firstPost = write(post, firstPost, writeStream);

        if (DEBUG) {
            print(post, true);
        } else {
            print(post);
        }

        postNo++;
    }

    writeStream.write(']\n');
    writeStream.close();

    await driver.quit();
})();
