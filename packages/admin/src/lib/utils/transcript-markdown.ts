/**
 * Convert transcript and report (TTTC categories) JSON into human-readable
 * markdown documents.
 *
 * TypeScript port of the `convert_to_markdown.py` reference script, split into
 * separate transcript and report formatters so each download button produces
 * its own `.md` file.
 */

export interface TranscriptEvent {
	text?: string;
	start_time?: number;
	end_time?: number;
	speaker_id?: string;
}

export interface TranscriptData {
	events?: TranscriptEvent[];
}

export interface QuoteReference {
	interview?: string;
	sourceId?: string;
}

export interface ReportQuote {
	text?: string;
	reference?: QuoteReference;
}

export interface ReportClaim {
	number?: number | string;
	title?: string;
	quotes?: ReportQuote[];
	similarClaims?: ReportClaim[];
}

export interface ReportSubtopic {
	title?: string;
	description?: string;
	claims?: ReportClaim[];
}

export interface ReportTopic {
	title?: string;
	description?: string;
	summary?: string;
	subtopics?: ReportSubtopic[];
	claims?: ReportClaim[];
}

export interface ReportMeta {
	title?: string;
	description?: string;
	date?: string;
	topics?: ReportTopic[];
}

/** Report payload shape: a version string followed by the metadata object. */
export interface ReportData {
	data?: [unknown, ReportMeta];
}

/** Convert seconds to MM:SS format. */
function formatTimestamp(seconds: number): string {
	const total = Math.floor(seconds);
	const minutes = Math.floor(total / 60);
	const secs = total % 60;
	return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format the transcript as markdown, grouping consecutive events by the same
 * speaker into a single paragraph with a leading timestamp.
 */
export function formatTranscriptMarkdown(transcript: TranscriptData): string {
	let md = '# Full Transcript\n\n';

	const events = transcript.events ?? [];
	let currentSpeaker: string | null = null;
	let speakerText: string[] = [];

	const flush = () => {
		if (currentSpeaker !== null && speakerText.length > 0) {
			md += `\n**${currentSpeaker}**: ${speakerText.join(' ')}\n`;
		}
	};

	for (const event of events) {
		const speaker = event.speaker_id ?? 'unknown';
		const text = (event.text ?? '').trim();
		const startTime = event.start_time ?? 0;

		if (speaker !== currentSpeaker) {
			flush();
			currentSpeaker = speaker;
			speakerText = [`[${formatTimestamp(startTime)}] ${text}`];
		} else {
			speakerText.push(text);
		}
	}

	flush();

	return md;
}

/** Format a single claim with its quotes and any related perspectives. */
function formatClaim(claim: ReportClaim, indentLevel = 0): string {
	const indent = '  '.repeat(indentLevel);
	let md = '';

	const claimNumber = claim.number ?? '';
	const claimTitle = claim.title ?? 'Untitled claim';
	md += `${indent}- **Claim ${claimNumber}**: ${claimTitle}\n\n`;

	for (const quote of claim.quotes ?? []) {
		const quoteText = quote.text ?? '';
		const speaker = quote.reference?.interview ?? 'unknown';
		md += `${indent}  > "${quoteText}"\n`;
		md += `${indent}  > — *${speaker}*\n\n`;
	}

	const similarClaims = claim.similarClaims ?? [];
	if (similarClaims.length > 0) {
		md += `${indent}  **Related perspectives:**\n\n`;
		for (const similar of similarClaims) {
			md += `${indent}  - ${similar.title ?? ''}\n`;
			for (const quote of similar.quotes ?? []) {
				const quoteText = quote.text ?? '';
				const speaker = quote.reference?.interview ?? 'unknown';
				md += `${indent}    > "${quoteText}" — *${speaker}*\n`;
			}
		}
		md += '\n';
	}

	return md;
}

/** Format a subtopic with its claims. */
function formatSubtopic(subtopic: ReportSubtopic, indentLevel = 0): string {
	const indent = '  '.repeat(indentLevel);
	let md = '';

	const title = subtopic.title ?? 'Untitled subtopic';
	const description = subtopic.description ?? '';

	md += `${indent}### ${title}\n\n`;
	if (description && description !== title) {
		md += `${indent}${description}\n\n`;
	}

	for (const claim of subtopic.claims ?? []) {
		md += formatClaim(claim, indentLevel);
	}

	return md;
}

/** Format a topic with its subtopics and claims. */
function formatTopic(topic: ReportTopic): string {
	let md = '';

	const title = topic.title ?? 'Untitled topic';
	const description = topic.description ?? '';
	const summary = topic.summary ?? '';

	md += `## ${title}\n\n`;

	if (description && description !== title) {
		md += `*${description}*\n\n`;
	}

	if (summary) {
		md += `**Summary**: ${summary}\n\n`;
	}

	for (const subtopic of topic.subtopics ?? []) {
		md += formatSubtopic(subtopic);
	}

	const claims = topic.claims ?? [];
	if (claims.length > 0) {
		md += '### Key Points\n\n';
		for (const claim of claims) {
			md += formatClaim(claim);
		}
	}

	md += '---\n\n';
	return md;
}

/**
 * Pull the report metadata out of the various shapes the report payload can
 * take: the `{ data: [version, meta] }` envelope, a `{ result: … }` wrapper
 * (returned when the report is delivered as a JSON string), or the bare
 * metadata object itself.
 */
export function normalizeReport(raw: unknown): ReportMeta {
	let value: unknown = raw;

	if (typeof value === 'string') {
		try {
			value = JSON.parse(value);
		} catch {
			return {};
		}
	}

	if (value && typeof value === 'object' && 'result' in value) {
		value = (value as { result: unknown }).result;
	}

	if (value && typeof value === 'object' && 'data' in value) {
		const data = (value as ReportData).data;
		if (Array.isArray(data) && data.length > 1) {
			return (data[1] as ReportMeta) ?? {};
		}
		return {};
	}

	return (value as ReportMeta) ?? {};
}

/** Format the report (TTTC categories) as markdown. */
export function formatReportMarkdown(raw: unknown): string {
	const meta = normalizeReport(raw);

	let md = '';

	const title = meta.title ?? 'Event Report';
	const description = meta.description ?? '';
	const date = meta.date ?? '';

	md += `# ${title}\n\n`;

	if (date) {
		md += `*Date: ${date}*\n\n`;
	}

	if (description) {
		md += `${description}\n\n`;
	}

	md += '---\n\n';

	const topics = meta.topics ?? [];
	if (topics.length > 0) {
		md += '# Analysis Topics\n\n';
		for (const topic of topics) {
			md += formatTopic(topic);
		}
	}

	return md;
}

/** Trigger a browser download for the given markdown text. */
export function downloadMarkdown(filename: string, markdown: string): void {
	const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
