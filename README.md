<div align="center">

# 💼 [Jobs.cz](https://www.jobs.cz/prace/) Scraper

### A simple data scraper of [Jobs.cz](https://www.jobs.cz/prace/) written in multiple JS/TS libraries.

A programming exercise and an experiment to determine which **JavaScript / TypeScript** library is the best option for web scraping.

*The libraries used are Puppeteer [^1], Playwright and Selenium.*

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
**Puppeteer** offers very little in this case and it's best to write your own wrapper functions which suit your specific needs but it offers the most modularity making this process easier compared to the others. [^2]

Both **Playwright** and **Selenium** offer a support for multiple browsers *(unlike **Puppeteer** which has only experimental support for **Edge** via [puppeteer-core](https://www.npmjs.com/package/puppeteer-core) and **Firefox** via [puppeteer-firefox](https://www.npmjs.com/package/puppeteer-firefox))*.

[^1]: Note that the **Puppeteer** script scrapes more data than the other scripts and also provides other functionalities because it's the library that I chose to go with in my project.

[^2]: You can check out my [🧰 puppethelper - A Puppeteer helper package for automated QA web testing](https://github.com/zahradnik-ondrej/puppethelper) which has many useful functions for interacting with the web browser out-of-the-box plus a little extra.

</div>
