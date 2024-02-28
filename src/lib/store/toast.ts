// store.ts
import { writable, type Writable } from 'svelte/store';

// Create a writable store to store error logs
export const errorStore = writable<Array<ToastLog>>([]);

export type ToastLog = {
	message: string;
	type: 'error' | 'success' | 'warn';
};

// Function to add error logs to the store
export function addErrorLog(error: ToastLog) {
	errorStore.update((logs) => {
		if (logs.length > 4) {
			logs.shift();
		}
		const newLogs = logs.slice();
		newLogs.push(error);

		return newLogs;
	});
}

// Function to clear error logs from the store
export function clearErrorLogs() {
	errorStore.set([]);
}
