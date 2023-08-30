import puppeteer, { Browser, Page } from 'puppeteer';
import * as ph from 'puppethelper';
import chalk from 'chalk';
import fs, { WriteStream } from 'fs';
import {Parameters} from './src/interfaces/Parameters';
import {Post} from './src/interfaces/Post';
import {parseArgs} from './src/functions/parseArgs';
import {constructUrl} from './src/functions/constructUrl';
import {getSalary} from './src/functions/getSalary';
import {getTags} from './src/functions/getTags';
import {write} from './src/functions/write';
import {print} from './src/functions/print';
import {DEBUG} from './src/constants/DEBUG';

(async(): Promise<void> => {
    const params: Parameters = {
        tags: ['python', 'javascript'],
        salary: 50000,
        education: 'high',
        arrangement: 'work-mostly-from-home',
        employer: 'direct',
    }

    //const params: Parameters = parseArgs();

    const writeStream: WriteStream = fs.createWriteStream('job_posts.json', { flags: 'w' });
    writeStream.write('[\n');
    let firstPost: boolean = true;

    let browser: Browser, page: Page;

    let opts = ph.BROWSER_OPTS;
    browser = await puppeteer.launch(opts);
    page = await browser.newPage();
    page.setDefaultTimeout(ph.PAGE_OPTS.DEFAULT_TIMEOUT);
    const url: string = constructUrl(params);
    await page.goto(url);
    await ph.timeout(1);

    let post: Post = {};
    const nextPageSelector: string = 'html > body > div nav > ul > li:last-of-type > a[class="Button Button--secondary Button--square Pagination__button--next"]';
    let postNo: number = 1;
    let pageNo: number = 1;
    const exactLocationSelector: string = 'html > body > div > div > p > a';

    while (true) {
        const postSelector: string = `html > body > div article:nth-of-type(${postNo})`;
        try {
            await ph.waitForSelector(page, postSelector, 'css', 1);
        } catch(e) {
            try {
                await ph.click(page, nextPageSelector, 'css', 1);
                postNo = 1;
                pageNo++;
                if (DEBUG) {
                    console.log(chalk.bold(chalk.yellow(`- clicked next page (${pageNo}) -`)));
                    console.log();
                }
                continue;
            } catch(e) {
                break;
            }
        }

        const titleSelector: string = `${postSelector} > header > h2 > a`;
        const companySelector: string = `${postSelector} > footer > ul > li:nth-of-type(1) > span`;
        const locationSelector: string = `${postSelector} > footer > ul > li:nth-of-type(2)`;

        post.title = await ph.getText(page, titleSelector);
        post.url = await ph.getAttribute(page, titleSelector, 'href');
        await getSalary(page, post, postSelector);
        await getTags(page, post, postSelector);
        post.company = await ph.getText(page, companySelector);
        post.location = await ph.getText(page, locationSelector);
        //await getExactLocation(page, post, titleSelector, exactLocationSelector);

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

    await browser.close();
})()
