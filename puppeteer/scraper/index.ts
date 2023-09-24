import puppeteer, { Browser, Page } from 'puppeteer';
import * as ph from 'puppethelper';
import chalk from 'chalk';
import fs, { WriteStream } from 'fs';
import { MongoClient, ObjectId, Db} from 'mongodb';

const dbUrl: string = 'mongodb://localhost:27017';
const dbName: string = 'jobPostings';

import {Parameters} from './src/interfaces/Parameters';
import {Post} from './src/interfaces/Post';
import {parseArgs} from './src/functions/parseArgs';
import {constructUrl} from './src/functions/constructUrl';
import {getSalary} from './src/functions/getSalary';
import {getTags} from './src/functions/getTags';
import {write} from './src/functions/write';
import {print} from './src/functions/print';
import {DEBUG} from './src/constants/DEBUG';

/*
function writeMongo(db: Db, post: Post): void {
    post._id = new ObjectId();
    db.collection('postings').insertOne(post);
}
*/

async function writeMongo(db: Db, post: Post): Promise<void> {
    const collection = db.collection('postings');
    const query = { url: post.url };
    const existingPost = await collection.findOne(query);

    if (!existingPost) {
        post._id = new ObjectId();
        await collection.insertOne(post);
    } else {
        console.log('Post already exists:', post);
    }
}

(async(): Promise<void> => {
    let params: Parameters;

    if (process.argv.length === 2) {
        import('../web/job-params.json').then(parametersData => {
            params = parametersData.default as unknown as Parameters;
        });
    } else {
        params = parseArgs();
    }

    const client: MongoClient = new MongoClient(dbUrl);
    await client.connect();
    let db: Db = client.db(dbName);

    const writeStream: WriteStream = fs.createWriteStream('job_posts.json', { flags: 'w' });
    writeStream.write('[\n');
    let firstPost: boolean = true;

    let browser: Browser, page: Page;

    let opts = ph.BROWSER_OPTS;
    browser = await puppeteer.launch(opts);
    page = await browser.newPage();
    page.setDefaultTimeout(ph.PAGE_OPTS.DEFAULT_TIMEOUT);
    // @ts-ignore
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
        writeMongo(db, post);
        if (DEBUG) {
            print(post, true);
        } else {
            print(post);
        }

        postNo++;
    }

    writeStream.write(']\n');
    writeStream.close();

    //await client.close();

    await browser.close();
})()
