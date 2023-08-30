import {WebDriver, WebElement} from "selenium-webdriver";
import {getElement} from './getElement';

async function getText(driver: WebDriver, elementOrSelector: WebElement | string, timeout: number = 200): Promise <string | undefined> {
    const element: WebElement = await getElement(driver, elementOrSelector);
    const text: string = await driver.wait(async (): Promise<string> => await element.getText(), timeout);
    if (text) {
        return text.trim();
    }
}

export {getText}