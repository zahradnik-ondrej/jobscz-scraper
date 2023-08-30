import {Page} from "playwright";

async function getText(page: Page, selector: string, timeout: number = 0.2): Promise <string | undefined> {
    timeout *= 1000;
    let text: string | null = await page.textContent(selector, { timeout: timeout });
    if (text) {
        return text.trim();
    }
}

export {getText}