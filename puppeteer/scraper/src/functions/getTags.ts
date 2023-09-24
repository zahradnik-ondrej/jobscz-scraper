import {Page} from 'puppeteer';
import * as ph from 'puppethelper';
import {Post} from '../interfaces/Post';

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

export {getTags}