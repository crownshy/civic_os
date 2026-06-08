/**
 * Legacy event shape used by the public site + region config.
 * See ADR 0001 — the canonical `Event` type (in ./event.ts) matches the API
 * payload. Adapters convert between the two.
 */
export interface ConversationEvent {
	id?: string;
	slug: string;
	title: string;
	topic?: string;
	location: string;
	time: string;
	endTime?: string;
	date: string;
	format: 'in-person' | 'online';
	description: string;
	fullDescription?: string;
	venueName?: string;
	address?: string;
	duration?: string;
	imageUrl?: string;
	signupUrl?: string;
}
