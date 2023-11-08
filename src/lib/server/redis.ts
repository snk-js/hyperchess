import type { Room } from '$lib/store/rooms';
import Redis from 'ioredis';

const redis = new Redis();

const MAX_ROOMS = 50; // Set the maximum number of rooms

// Function to add a new room with a boundary limit
export async function addOneRoom(roomId: number, roomData: Partial<Room>) {
	const roomCount = await redis.hlen('rooms');
	if (roomCount < MAX_ROOMS) {
		await redis.hset('rooms', roomId, JSON.stringify(roomData));
		return true; // Room added successfully
	} else {
		console.log('Room limit reached. Cannot add more rooms.');
		return false; // Indicate that the room was not added
	}
}

// Function to get all rooms
export async function getAllRooms() {
	const rooms = await redis.hgetall('rooms');
	return Object.values(rooms).map((room) => JSON.parse(room));
}

// Function to delete one room
export async function deleteOneRoom(roomId: number) {
	return await redis.hdel('rooms', String(roomId));
}

// Get all rooms
getAllRooms().then((rooms) => {
	console.log('Rooms:', rooms);
});

// Delete a room
deleteOneRoom(123123123).then(() => {
	console.log('Room deleted');
});

// addOneRoom(roomData.id, roomData).then(added => {
//   if (added) {
//     console.log('Room added');
//   } else {
//     console.log('Failed to add room');
//   }
// });

export default redis;
