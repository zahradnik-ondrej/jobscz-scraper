cd scraper || exit

npm install

cd ..
cd web || exit

npm install

npm start &

sleep 1

xdg-open 'http://localhost:3000'