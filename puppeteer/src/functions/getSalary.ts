import {Page} from 'puppeteer';
import * as ph from 'puppethelper';
import {Post} from '../interfaces/Post';

async function getSalary(page: Page, post: Post, postSelector: string): Promise<void> {
    post.salary = null
    const salarySelector: string = `${postSelector} > div > span[class="Tag Tag--success Tag--small Tag--subtle"]`;
    try {
        post.salary = await ph.getText(page, salarySelector);
    } catch(e) {
        // this stays empty
    }
}

export {getSalary}