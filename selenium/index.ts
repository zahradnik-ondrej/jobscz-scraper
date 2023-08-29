import {Builder, By, ThenableWebDriver, WebElement} from 'selenium-webdriver';
import {DriverService} from "selenium-webdriver/remote";
import chrome from 'selenium-webdriver/chrome';
import chalk from 'chalk';
import fs, {WriteStream} from 'fs';

const DEBUG: boolean = true;

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

async function getText(element: WebElement, timeout: number = 200): Promise<string | undefined> {
    try {
        const text: string = await element.getDriver().wait(async(): Promise<string> => await element.getText(), timeout);
        if (text) {
            return text.trim();
        }
    } catch (e) {
        // Handle timeout or other exceptions
    }
}


async function getSalary(element: WebElement, post: Post): Promise<void> {
    post.salary = null;
    try {
        const salaryElement: WebElement = await element.findElement(By.css('div > span.Tag.Tag--success.Tag--small.Tag--subtle'));
        post.salary = await getText(salaryElement);
    } catch (e) {
        // this stays empty
    }
}

async function getTags(element: WebElement, post: Post): Promise<void> {
    post.tags = [];
    let tagNo: number = 1;
    while (true) {
        const tagSelector: string = `div > span.Tag.Tag--neutral.Tag--small.Tag--subtle:nth-of-type(${tagNo})`;
        try {
            const tagElement: WebElement = await element.findElement(By.css(tagSelector));
            const tagText: string | undefined = await getText(tagElement);
            if (tagText) {
                post.tags.push(tagText);
            }
            tagNo++;
        } catch (e) {
            break;
        }
    }
}

async function print(post: Post, url: boolean = false): Promise<void> {
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

async function write(post: Post, first_post: boolean, writeStream: fs.WriteStream): Promise<boolean> {
    if (!first_post) {
        writeStream.write(',\n');
    }

    writeStream.write('  ' + JSON.stringify(post, null, 2));
    return false;
}

(async(): Promise<void> => {
    const options = new chrome.Options();
    options.headless();

    const driver: ThenableWebDriver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();


    await driver.get('https://www.jobs.cz/prace/');
    await driver.sleep(1000);

    const writeStream: WriteStream = fs.createWriteStream('job_posts.json', { flags: 'w' });
    writeStream.write('[\n');
    let first_post: boolean = true;

    let postNo: number = 1;
    let pageNo: number = 1;

    while (true) {
        const postSelector: string = `div article:nth-of-type(${postNo})`;
        try {
            await driver.wait(async(): Promise<WebElement> => await driver.findElement(By.css(postSelector)), 1000);
        } catch (e) {
            try {
                const nextPageSelector: string = 'html > body > div nav > ul > li:last-of-type > a.Button.Button--secondary.Button--square.Pagination__button--next';
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

        const titleSelector: string = postSelector + ' header h2 a';
        const postElement: WebElement = await driver.findElement(By.css(postSelector));

        const post: Post = {};
        post.title = await getText(postElement.findElement(By.css('header h2 a')));

        if (post.title) {
            post.url = await postElement.findElement(By.css('header h2 a')).getAttribute('href');
            await getSalary(postElement, post);
            await getTags(postElement, post);

            post.company = await getText(postElement.findElement(By.css('footer > ul > li:nth-of-type(1) > span')));
            post.location = await getText(postElement.findElement(By.css('footer > ul > li:nth-of-type(2)')));

            first_post = await write(post, first_post, writeStream);
            if (DEBUG) {
                await print(post, true);
            } else {
                await print(post);
            }
        }

        postNo++;
    }

    writeStream.write(']\n');
    writeStream.close();

    await driver.quit();
})();
