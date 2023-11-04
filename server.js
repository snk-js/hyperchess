import { handler } from './build/handler.js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
console.log({ok: process.env.DATABASE_URL});

const app = express();

app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

app.use(handler);

app.listen(3000, () => {
	console.log('listening on port 3000');
});