import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import * as ph from 'puppethelper';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const port: number = 3000;
const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/submit', (req: Request, res: Response): void => {
    const jobParams: string = JSON.stringify(req.body, null, 2);
    fs.writeFile('job-params.json', jobParams, (err) => {
        if (err) {
            res.status(500).send('Failed to write to file.');
            return;
        }

        ph.executeCommand('cd ../scraper && npm start');
    });
});

app.listen(port, (): void => {
    console.log(`Server running on http://localhost:${port}..`);
});
