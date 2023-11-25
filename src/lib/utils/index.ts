export const getDigitsFromString = (str: string): number => {
	return str ? Number(str.replace(/\D/g, '')) : Math.floor(Math.random() * 1000);
};
