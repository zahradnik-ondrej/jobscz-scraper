<div align="center">

# 💼 Jobs.cz Scraper

### A simple data scraper of Jobs.cz written in multiple JS/TS libraries.

A programming exercise and an experiment to determine which **JavaScript / TypeScript** library is the best option for web scraping.

*The libraries used are Puppeteer, Playwright and Selenium.*

***

### Installation:

`clone https://github.com/zahradnik-ondrej/jobscz-scraper.git`

`cd jobscz-scraper`

`cd puppeteer` or `cd playwright` or `cd selenium`

`npm install` and `npm start` in case of **Puppeteer** or **Playwright** or `ts-node index.ts` in case of **Selenium**

***

### Observations:

**Puppeteer** and **Selenium** are equally fast in this specific case.  
**Puppeteer** and **Selenium** are **~3.6944..** times faster than **Playwright** in this specific case.

**Playwright** offers the most intuitive built-in functions for interacting with the web browser making it most suitable for beginners.  
**Selenium** also offers many built-in functions but they are not as intuitive.  
**Puppeteer** offers very little in this case and it's best to write wrapper functions which suit your specific needs but it offers the most modularity making this process easier compared to the others.

Both **Playwright** and **Selenium** offer a support for multiple browsers *(unlike **Puppeteer** which has only experimental support for **Edge** and **Firefox**)*.

</div>
