import {Browser, Page, chromium} from 'playwright';
import chalk from 'chalk';
import fs, { WriteStream } from 'fs';
import {DEBUG} from './src/constants/DEBUG';
import {getText} from './src/functions/getText';
import {print} from './src/functions/print';
import {write} from './src/functions/write';
import {Post} from './src/interfaces/Post';

async function getSalary(page: Page, post: Post, postSelector: string): Promise<void> {
    post.salary = null;
    const salarySelector: string = `${postSelector} > div > span[class="Tag Tag--success Tag--small Tag--subtle"]`;
    try {
        post.salary = await getText(page, salarySelector);
    } catch (e) {
        // this stays empty
    }
}

async function getTags(page: Page, post: Post, postSelector: string): Promise<void> {
    post.tags = [];
    let tag: {no?: number, selector?: string, text?: string | undefined} = {};
    tag.no = 1;
    while (true) {
        tag.selector = `${postSelector} > div > span[class="Tag Tag--neutral Tag--small Tag--subtle"]:nth-of-type(${tag.no})`;
        try {
            tag.text = await getText(page, tag.selector);
            if (tag.text) {
                post.tags.push(tag.text);
                tag.no++;
            }
        } catch (e) {
            break;
        }
    }
}

(async(): Promise<void> => {
    const writeStream: WriteStream = fs.createWriteStream('job-posts.json', { flags: 'w' });
    writeStream.write('[\n');
    let firstPost: boolean = true;

    let browser: Browser, page: Page;
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto('https://www.jobs.cz/prace/');
    await page.waitForTimeout(1000);

    let post: Post = {};
    const nextPageSelector: string = 'html > body > div nav > ul > li:last-of-type > a[class="Button Button--secondary Button--square Pagination__button--next"]';
    let postNo: number = 1;
    let pageNo: number = 1;

    while (true) {
        const postSelector: string = `html > body > div article:nth-of-type(${postNo})`;
        try {
            await page.waitForSelector(postSelector, { timeout: 1000 });
        } catch(e) {
            try {
                await page.click(nextPageSelector, { timeout: 2000 });
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

        const title: string | undefined = await getText(page, titleSelector);
        post.title = title ?? undefined;

        post.url = await page.getAttribute(titleSelector, 'href');
        await getSalary(page, post, postSelector);
        await getTags(page, post, postSelector);

        const company: string | undefined = await getText(page, companySelector);
        post.company = company ?? undefined;

        const location: string | undefined = await getText(page, locationSelector);
        post.location = location ?? undefined;

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
