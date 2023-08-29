import puppeteer, { Browser, Page } from 'puppeteer';
import * as ph from 'puppethelper';
import chalk from 'chalk';
import fs from 'fs';

const DEBUG: boolean = false;

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
    post.salary = null
    const salary_selector: string = post_selector + ' > div > span[class="Tag Tag--success Tag--small Tag--subtle"]';
    try {
        post.salary = await ph.getText(page, salary_selector);
    } catch(e) {
        // this stays empty
    }
}

async function getTags(page: Page, post: Post, post_selector: string): Promise<void> {
    post.tags = [];
    let tag: {no?: number, selector?: string, text?: string} = {};
    tag.no = 1;
    while (true) {
        tag.selector = post_selector + ` > div > span[class="Tag Tag--neutral Tag--small Tag--subtle"]:nth-of-type(${tag.no})`;
        try {
            tag.text = await ph.getText(page, tag.selector);
            post.tags.push(tag.text);
            tag.no++;
        } catch(e) {
            break;
        }
    }
}

async function getExactLocation(page: Page, post: Post, title_selector: string, exact_location_selector: string): Promise<void> {
    post.exact_location = null;
    await ph.click(page, title_selector);
    let page_url: string = page.url();
    if (post.url !== page_url) {
        post.url2 = page_url;
    }
    let page_hostname: string = new URL(page_url).hostname;
    if (page_hostname === 'www.jobs.cz') {
        try {
            await ph.waitForSelector(page, exact_location_selector, 'css', 5);
            post.exact_location = {
                text: await ph.getText(page, exact_location_selector),
                url: await ph.getAttribute(page, exact_location_selector, 'href'),
            };
        } catch(e) {
            // this stays empty
        }
    }
    await page.goBack();

    page_hostname = new URL(page.url()).hostname;
    while(page_hostname !== 'www.jobs.cz') {
        await page.goBack();
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

    if (post.exact_location && post.location) {
        let exact_location_url: string | null;
        if (post.exact_location.url) {
            exact_location_url = chalk.gray(`(${post.exact_location.url})`);
            if (!url) {
                exact_location_url = '';
            }
        } else {
            exact_location_url = '';
        }
        if (post.exact_location.text.includes(post.location)) {
            console.log(`${post.exact_location.text} ${exact_location_url}`);
        } else if (post.location.includes(post.exact_location.text)) {
            console.log(`${post.location} ${exact_location_url}`);
        } else {
            console.log(post.location);
        }
    } else if (post.location) {
        console.log(post.location);
        if (DEBUG) {
            //console.log(chalk.red('exact location not found'));
        }
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

const writeStream = fs.createWriteStream('job_posts.json', { flags: 'w' });
writeStream.write('[\n');
let first_post: boolean = true;

(async(): Promise<void> => {
    let browser: Browser, page: Page;

    let opts = ph.BROWSER_OPTS;
    browser = await puppeteer.launch(opts);
    page = await browser.newPage();
    page.setDefaultTimeout(ph.PAGE_OPTS.DEFAULT_TIMEOUT);
    await page.goto('https://www.jobs.cz/prace/');
    await ph.timeout(1);

    let post: Post = {};
    const next_page_selector: string = 'html > body > div nav > ul > li:last-of-type > a[class="Button Button--secondary Button--square Pagination__button--next"]';
    let post_selector: string;
    let post_no: number = 1;
    let page_no: number = 1;
    const exact_location_selector: string = 'html > body > div > div > p > a';

    while (true) {
        post_selector = `html > body > div article:nth-of-type(${post_no})`;
        try {
            await ph.waitForSelector(page, post_selector, 'css', 1);
        } catch(e) {
            try {
                await ph.click(page, next_page_selector, 'css', 1);
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

        post.title = await ph.getText(page, title_selector);
        post.url = await ph.getAttribute(page, title_selector, 'href');
        await getSalary(page, post, post_selector);
        await getTags(page, post, post_selector);
        post.company = await ph.getText(page, company_selector);
        post.location = await ph.getText(page, location_selector);
        //await getExactLocation(page, post, title_selector, exact_location_selector);

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
