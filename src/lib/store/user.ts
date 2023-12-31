import { writable } from 'svelte/store';

export interface User {
	id?: string;
	username?: string;
	name?: string;
	email?: string;
	clientId?: string;
	connected?: boolean;
	wsUrl?: string;
	ws?: WebSocket | null;
	playing: boolean;
}

export const userPlaceholder = {
	id: '',
	name: '',
	email: '',
	username: '',
	clientId: '',
	connected: false,
	wsUrl: '',
	ws: null,
	playing: false
};

const userStore = writable<User>(userPlaceholder);

export default userStore;
