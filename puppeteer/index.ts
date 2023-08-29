import puppeteer, { Browser, Page } from 'puppeteer';
import * as ph from 'puppethelper';
import chalk from 'chalk';
import fs, { WriteStream } from 'fs';

const DEBUG: boolean = true;

interface Parameters {
    tags?: string[];
    locality?:
        'praha' |
        'jihocesky-kraj' |
        'jihomoravsky-kraj' |
        'karlovarsky-kraj' |
        'kralovohradecky-kraj' |
        'liberecky-kraj' |
        'moravskoslezsky-kraj' |
        'olomoucky-kraj' |
        'pardubicky-kraj' |
        'plzensky-kraj' |
        'stredocesky-kraj' |
        'ustecky-kraj' |
        'vysocina-kraj' |
        'zlinsky-kraj' |
        'slovensko' |
        'nemecko' |
        'polsko' |
        'rakousko' |
        'velka-britanie-a-severni-irsko' |
        'irsko',
    radius?: 10 | 20 | 30 | 40 | 50,
    date?: '24h' | '3d' | '7d',
    salary?: number,
    employmentContract?: string[],
    education?: 'primary' | 'high' | 'uni',
    languageSkill?: string[],
    arrangement?: 'partial-work-from-home' | 'work-mostly-from-home' | 'flexible-hours',
    employer?: 'direct' | 'agency' | 'ngo',
    suitableFor?: 'graduates' | 'retired' | 'maternity' | 'ukraine_refugees',
    disabled?: boolean,
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

const regions: string[] = [
    'praha',
    'jihocesky-kraj',
    'jihomoravsky-kraj',
    'karlovarsky-kraj',
    'kralovohradecky-kraj',
    'liberecky-kraj',
    'moravskoslezsky-kraj',
    'olomoucky-kraj',
    'pardubicky-kraj',
    'plzensky-kraj',
    'stredocesky-kraj',
    'ustecky-kraj',
    'vysocina-kraj',
    'zlinsky-kraj',
]

const countries: string[] = [
    'slovensko',
    'nemecko',
    'polsko',
    'rakousko',
    'velka-britanie-a-severni-irsko',
    'irsko',
]

function parseArgs(): Parameters {
    const args: string[] = process.argv.slice(2);
    const params: Parameters = {};

    for (let i: number = 0; i < args.length; i++) {
        const value: string = args[++i];
        switch (args[i - 1]) {
            case '--tags':
                params.tags = value.split(',');
                break;
            case '--locality':
                if (regions.includes(value) || countries.includes(value)) {
                    params.locality = value as Parameters['locality'];
                }
                break;
            case '--radius':
                if ([10, 20, 30, 40, 50].includes(Number(value))) {
                    params.radius = Number(value) as Parameters['radius'];
                }
                break;
            case '--date':
                if (['24h', '3d', '7d'].includes(value)) {
                    params.date = value as Parameters['date'];
                }
                break;
            case '--salary':
                params.salary = Number(value);
                break;
            case '--employmentContract':
                params.employmentContract = value.split(',');
                break;
            case '--education':
                if (['primary', 'high', 'uni'].includes(value)) {
                    params.education = value as Parameters['education'];
                }
                break;
            case '--languageSkill':
                params.languageSkill = value.split(',');
                break;
            case '--arrangement':
                if (['partial-work-from-home', 'work-mostly-from-home', 'flexible-hours'].includes(value)) {
                    params.arrangement = value as Parameters['arrangement'];
                }
                break;
            case '--employer':
                if (['direct', 'agency', 'ngo'].includes(value)) {
                    params.employer = value as Parameters['employer'];
                }
                break;
            case '--suitableFor':
                if (['graduates', 'retired', 'maternity', 'ukraine_refugees'].includes(value)) {
                    params.suitableFor = value as Parameters['suitableFor'];
                }
                break;
            case '--disabled':
                params.disabled = value === 'true';
                break;
            default:
                console.log(`Unknown argument: ${args[i - 1]}`);
                break;
        }
    }
    return params;
}

function constructURL(parameters: Parameters): string {
    let url: string = 'https://www.jobs.cz/prace/';

    if (parameters.locality) {
        if (regions.includes(parameters.locality)) {
            url = `${url}${parameters.locality}/?`;
        }
    } else {
        url = `${url}?`
    }

    if (parameters.tags) {
        for (let t: number = 0; t < parameters.tags.length; t++) {
            url = `${url}q[]=${parameters.tags[t]}&`;
        }
    }

    if (parameters.locality) {
        switch (parameters.locality) {
            case 'slovensko':
                url = `${url}locality[code]=C217&locality[label]=Slovensko&`;
                break;
            case 'nemecko':
                url = `${url}locality[code]=C91&locality[label]=Německo&`;
                break;
            case 'polsko':
                url = `${url}locality[code]=C196&locality[label]=Polsko&`;
                break;
            case 'rakousko':
                url = `${url}locality[code]=C15&locality[label]=Rakousko&`;
                break;
            case 'velka-britanie-a-severni-irsko':
                url = `${url}locality[code]=C250&locality[label]=Velká Británie a Severní Irsko&`;
                break;
            case 'irsko':
                url = `${url}locality[code]=C117&locality[label]=Irsko&`;
                break;
        }
    }

    if (parameters.date) {
        url = `${url}date=${parameters.date}&`;
    }

    if (parameters.salary) {
        if (parameters.salary >= 0 && parameters.salary <= 200000) {
            url = `${url}salary=${parameters.salary}&`;
        }
    }

    if(parameters.education) {
        url = `${url}education=${parameters.education}&`;
    }

    if (parameters.arrangement) {
        url = `${url}arrangement=${parameters.arrangement}&`;
    }

    if (parameters.employer) {
        url = `${url}employer=${parameters.employer}&`;
    }

    if (parameters.disabled) {
        url = `${url}disabled=1&`;
    } else {
        url = `${url}suitable-for=${parameters.suitableFor}&`;
    }

    if (parameters.locality === 'praha') {
        if (parameters.radius) {
            url = `${url}locality[radius]=${parameters.radius}`;
        } else {
            url = `${url}locality[radius]=0`;
        }
    }

    return url;
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
    /*
    const params: Parameters = {
        tags: ['python', 'javascript'],
        salary: 50000,
        education: 'high',
        arrangement: 'work-mostly-from-home',
        employer: 'direct',
    }
    */

    const params: Parameters = parseArgs();

    const writeStream: WriteStream = fs.createWriteStream('job_posts.json', { flags: 'w' });
    writeStream.write('[\n');
    let firstPost: boolean = true;

    let browser: Browser, page: Page;

    let opts = ph.BROWSER_OPTS;
    browser = await puppeteer.launch(opts);
    page = await browser.newPage();
    page.setDefaultTimeout(ph.PAGE_OPTS.DEFAULT_TIMEOUT);
    const url: string = constructURL(params);
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
