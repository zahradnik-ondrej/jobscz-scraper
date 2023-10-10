cd scraper || exit

npm install puppeteer chalk@4 puppethelper
npm install --save-dev @types/node @types/puppeteer @types/chalk

cd ../web || exit

npm install ts-node

npm start