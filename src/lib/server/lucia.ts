import { sveltekit } from 'lucia/middleware';
import { dev } from '$app/environment';
import { lucia } from 'lucia';
import { prisma } from '@lucia-auth/adapter-prisma';
import { PrismaClient } from '@prisma/client';
import { env } from '$env/dynamic/private';

const client = global.__client || new PrismaClient();

if (env.NODE_ENV === 'development') {
	global.__client = client;
}

export const auth = lucia({
	adapter: prisma(client, {
		user: 'authUser',
		session: 'authSession',
		key: 'authKey'
	}),
	env: dev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username,
			name: userData.name
		};
	},
	experimental: {
		debugMode: true
	}
});
