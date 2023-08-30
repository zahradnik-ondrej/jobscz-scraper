import {Page} from 'puppeteer';
import * as ph from 'puppethelper';
import {Post} from '../interfaces/Post';

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

export {getExactLocation}