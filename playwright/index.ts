import {Browser, Page, chromium} from 'playwright';
import chalk from 'chalk';
import fs, { WriteStream } from 'fs';

const DEBUG: boolean = true;

async function getText(page: Page, selector: string, timeout: number = 0.2): Promise <string | undefined> {
    timeout *= 1000;
    let text: string | null = await page.textContent(selector, { timeout: timeout });
    if (text) {
        return text.trim();
    }
}

interface Post {
    url?: string | null,
    url2?: string,
    title?: string,
    salary?: string | null,
    tags?: string[],
    company?: string,
    location?: string,
    exactLocation?: { text: string, url: string | null } | null,
}

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

function print(post: Post, url: boolean = false): void {
    if (post.title) {
        console.log(chalk.bold(post.title));
    }

    if (url) {
        if (post.url) {
            console.log(chalk.gray(`(${post.url})`))
        }
        if (post.url2) {
            console.log(chalk.gray(`(${post.url2})`))
        }
    }

    if (post.salary) {
        console.log(post.salary);
    } else if (DEBUG) {
        console.log(chalk.red('salary not found'));
    }

    if (post.tags && post.tags.length) {
        console.log(post.tags);
    } else if (DEBUG) {
        console.log(chalk.red('tags not found'));
    }

    if (post.company) {
        console.log(post.company);
    }

    if (post.location) {
        console.log(post.location);
    }

    console.log();
}

function write(post: Post, firstPost: boolean, writeStream: fs.WriteStream): boolean {
    if (!firstPost) {
        writeStream.write(',\n');
    }

    writeStream.write('  ' + JSON.stringify(post, null, 2));
    return false;
}

(async(): Promise<void> => {
    const writeStream: WriteStream = fs.createWriteStream('job_posts.json', { flags: 'w' });
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
