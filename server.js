import { handler } from './build/handler.js';
import { attachWebSockets } from './src/lib/server/ws/attach.js';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

app.use(handler);

const server = http.createServer(app);
attachWebSockets(server);

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
	console.log(`listening on port ${port}`);
});
