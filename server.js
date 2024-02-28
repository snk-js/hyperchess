import { handler } from './build/handler.js';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 

dotenv.config();
console.log({ok: process.env.DATABASE_URL});

const app = express();

import os from 'os';

const getIPAddress = () => {
	const interfaces = os.networkInterfaces();
	for (const iface in interfaces) {
		for (const alias of interfaces[iface]) {
			if (alias.family === 'IPv4' && !alias.internal) {
				return alias.address;
			}
		}
	}
	return '0.0.0.0';
};


const corsOptions = {
	origin: '*', // Adjust this as needed for your environment
	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed methods
	allowedHeaders: '*', // Allow any header
	credentials: true, // Set to true if your frontend needs to pass credentials (cookies, HTTP authentication)
	optionsSuccessStatus: 204 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

app.get('/healthcheck', (req, res) => {
    res.end('ok');
});

app.use(handler);

app.listen(3000, '0.0.0.0', () => {
	console.log('my own ip',getIPAddress())

    console.log('listening on port 3000');
});