import { writable } from 'svelte/store';

export interface User {
	id?: string;
	username?: string;
	name?: string;
	email?: string;
}

export const userPlaceholder = {
	id: '',
	name: '',
	email: '',
	username: ''
};

const userStore = writable<User>(userPlaceholder);

export default userStore;
