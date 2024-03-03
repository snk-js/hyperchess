// store.ts
import { writable, type Writable } from 'svelte/store';

// Create a writable store to store error logs
export const notificationStore = writable<Array<ToastLog>>([]);

export type ToastLog = {
	message: string;
	type: 'error' | 'success' | 'warn';
};

// Function to add error logs to the store
export function pushNotification(toastPayload: ToastLog) {
	notificationStore.update((logs) => {
		if (logs.length > 4) {
			logs.shift();
		}
		const newLogs = logs.slice();
		newLogs.push(toastPayload);

		return newLogs;
	});
}

// Function to clear error logs from the store
export function clearErrorLogs() {
	notificationStore.set([]);
}
