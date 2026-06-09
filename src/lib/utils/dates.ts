export function formatTimeDuration(start: Date, end: Date) {
	const durationMs = start - end;
	const totalSeconds = Math.floor(Math.abs(durationMs) / 1000);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	return { hours, minutes };
}
