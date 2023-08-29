import {Browser, Page, chromium} from 'playwright';
import chalk from 'chalk';
import fs, { WriteStream } from 'fs';

const DEBUG: boolean = false;

async function getText(page: Page, selector: string, timeout: number = 0.2): Promise <string | undefined> {
    timeout *= 1000;
    let text: string | null = await page.textContent(selector, { timeout: timeout });
    if (text) {
        return text.trim();
    }
}

interface Post {
    url?: string | null;
    url2?: string;
    title?: string;
    salary?: string | null;
    tags?: string[];
    company?: string;
    location?: string;
    exact_location?: { text: string, url: string | null } | null;
}

async function getSalary(page: Page, post: Post, post_selector: string): Promise<void> {
    post.salary = null;
    const salary_selector: string = `${post_selector} > div > span[class="Tag Tag--success Tag--small Tag--subtle"]`;
    try {
        post.salary = await getText(page, salary_selector);
    } catch(e) {
        // this stays empty
    }
}

async function getTags(page: Page, post: Post, post_selector: string): Promise<void> {
    post.tags = [];
    let tagNo: number = 1;
    while (true) {
        const tagSelector: string = `${post_selector} > div > span[class="Tag Tag--neutral Tag--small Tag--subtle"]:nth-of-type(${tagNo})`;
        try {
            const tagText: string | undefined = await getText(page, tagSelector);
            if (tagText) {
                post.tags.push(tagText);
            }
            tagNo++;
        } catch(e) {
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

function write(post: Post, first_post: boolean, writeStream: fs.WriteStream): boolean {
    if (!first_post) {
        writeStream.write(',\n');
    }

    writeStream.write('  ' + JSON.stringify(post, null, 2));
    return false;
}

const writeStream: WriteStream = fs.createWriteStream('job_posts.json', { flags: 'w' });
writeStream.write('[\n');
let first_post: boolean = true;

(async(): Promise<void> => {
    let browser: Browser, page: Page;
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto('https://www.jobs.cz/prace/');
    await page.waitForTimeout(1000);

    let post: Post = {};
    const next_page_selector: string = 'html > body > div nav > ul > li:last-of-type > a[class="Button Button--secondary Button--square Pagination__button--next"]';
    let post_selector: string;
    let post_no: number = 1;
    let page_no: number = 1;

    while (true) {
        post_selector = `html > body > div article:nth-of-type(${post_no})`;
        try {
            await page.waitForSelector(post_selector, { timeout: 1000 });
        } catch(e) {
            try {
                await page.click(next_page_selector, { timeout: 2000 });
                post_no = 1;
                page_no++;
                if (DEBUG) {
                    console.log(chalk.bold(chalk.yellow(`- clicked next page (${page_no}) -`)));
                    console.log();
                }
                continue;
            } catch(e) {
                break;
            }
        }

        const title_selector: string = post_selector + ' > header > h2 > a';
        const company_selector: string = post_selector + ' > footer > ul > li:nth-of-type(1) > span';
        const location_selector: string = post_selector + ' > footer > ul > li:nth-of-type(2)';

        const title: string | undefined = await getText(page, title_selector);
        post.title = title ?? undefined;
        post.url = await page.getAttribute(title_selector, 'href');
        await getSalary(page, post, post_selector);
        await getTags(page, post, post_selector);

        const company: string | undefined = await getText(page, company_selector);
        post.company = company ?? undefined;

        const location: string | undefined = await getText(page, location_selector);
        post.location = location ?? undefined;

        first_post = write(post, first_post, writeStream);
        if (DEBUG) {
            print(post, true);
        } else {
            print(post);
        }

        post_no++;
    }

    writeStream.write(']\n');
    writeStream.close();

    await browser.close();
})()
