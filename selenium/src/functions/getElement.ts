import {By, WebDriver, WebElement} from "selenium-webdriver";

async function getElement(driver: WebDriver, elementOrSelector: WebElement | string): Promise <WebElement> {
    if (elementOrSelector instanceof WebElement) {
        return elementOrSelector;
    }
    return (await driver.findElement(By.css(elementOrSelector)));
}

export {getElement}