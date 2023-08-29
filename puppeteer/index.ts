import puppeteer, { Browser, Page } from 'puppeteer';
import * as ph from 'puppethelper';
import chalk from 'chalk';
import fs, { WriteStream } from 'fs';

const DEBUG: boolean = true;

interface Post {
    url?: string | null;
    url2?: string;
    title?: string;
    salary?: string | null;
    tags?: string[];
    company?: string;
    location?: string;
    exactLocation?: { text: string, url: string | null } | null;
}

async function getSalary(page: Page, post: Post, postSelector: string): Promise<void> {
    post.salary = null
    const salarySelector: string = `${postSelector} > div > span[class="Tag Tag--success Tag--small Tag--subtle"]`;
    try {
        post.salary = await ph.getText(page, salarySelector);
    } catch(e) {
        // this stays empty
    }
}

async function getTags(page: Page, post: Post, postSelector: string): Promise<void> {
    post.tags = [];
    let tag: {no?: number, selector?: string, text?: string} = {};
    tag.no = 1;
    while (true) {
        tag.selector = `${postSelector} > div > span[class="Tag Tag--neutral Tag--small Tag--subtle"]:nth-of-type(${tag.no})`;
        try {
            tag.text = await ph.getText(page, tag.selector);
            post.tags.push(tag.text);
            tag.no++;
        } catch(e) {
            break;
        }
    }
}

async function getExactLocation(page: Page, post: Post, titleSelector: string, exactLocationSelector: string): Promise<void> {
    post.exactLocation = null;
    await ph.click(page, titleSelector);
    let pageUrl: string = page.url();
    if (post.url !== pageUrl) {
        post.url2 = pageUrl;
    }
    let pageHostname: string = new URL(pageUrl).hostname;
    if (pageHostname === 'www.jobs.cz') {
        try {
            await ph.waitForSelector(page, exactLocationSelector, 'css', 5);
            post.exactLocation = {
                text: await ph.getText(page, exactLocationSelector),
                url: await ph.getAttribute(page, exactLocationSelector, 'href'),
            };
        } catch(e) {
            // this stays empty
        }
    }
    await page.goBack();

    pageHostname = new URL(page.url()).hostname;
    while(pageHostname !== 'www.jobs.cz') {
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

    if (post.exactLocation && post.location) {
        let exactLocationUrl: string | null;
        if (post.exactLocation.url) {
            exactLocationUrl = chalk.gray(`(${post.exactLocation.url})`);
            if (!url) {
                exactLocationUrl = '';
            }
        } else {
            exactLocationUrl = '';
        }
        if (post.exactLocation.text.includes(post.location)) {
            console.log(`${post.exactLocation.text} ${exactLocationUrl}`);
        } else if (post.location.includes(post.exactLocation.text)) {
            console.log(`${post.location} ${exactLocationUrl}`);
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

    let opts = ph.BROWSER_OPTS;
    browser = await puppeteer.launch(opts);
    page = await browser.newPage();
    page.setDefaultTimeout(ph.PAGE_OPTS.DEFAULT_TIMEOUT);
    await page.goto('https://www.jobs.cz/prace/');
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
