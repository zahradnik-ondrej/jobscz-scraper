import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import * as ph from 'puppethelper';
import http from 'http';

import { MongoClient, Db} from 'mongodb';
const dbUrl: string = 'mongodb://localhost:27017';
const dbName: string = 'jobPostings';
const client: MongoClient = new MongoClient(dbUrl);

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const port: number = 3000;
const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

app.post('/submit', async (req: Request, res: Response): Promise<void> => {
    const jobParams: string = JSON.stringify(req.body, null, 2);

    await client.connect();
    let db: Db = client.db(dbName);

    await db.dropDatabase();
    //const collection: Collection = db.collection('parameters');
    //await collection.deleteMany({});

    await db.collection('parameters').insertOne(req.body);

    fs.writeFile('job-params.json', jobParams, (err) => {
        if (err) {
            res.status(500).send('Failed to write to file.');
            return;
        }

        ph.executeCommand('cd ../scraper && yarn start');
    });
});

server.listen(port, (): void => {
    console.log(`Server running on http://localhost:${port}..`);
});
