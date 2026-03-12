export type PolisStatement = {
	txt: string;
	tid: number;
	is_meta: boolean;
	is_seen: boolean;
	lang: string | undefined;
	remaining: number;
	total: number;
};

/**
 * Flow (will probably change when we fix the 500s):
 * 1. Fetch first statement via nextComment (no pid needed)
 * 2. Vote using xid — server auto-creates participant, returns currentPid
 * 3. Use currentPid for subsequent nextComment calls (not_voted_by_pid filter)
 */
export default class PolisApi {
	_currentStatement = $state<PolisStatement | undefined>();
	_loading = $state<boolean>(false);
	_error = $state<string | undefined>();
	_remaining = $state<number>(0);
	_total = $state<number>(0);
	_ready = $state<boolean>(false);

	polisId: string;
	userId: string;
	lang: string;
	baseUrl: string;
	pid: number | undefined = undefined;

	constructor(
		userId: string,
		polisId: string,
		lang: string = 'en',
		baseUrl: string = 'https://polis.comhairle.scot'
	) {
		this.polisId = polisId;
		this.userId = userId;
		this.lang = lang;
		this.baseUrl = baseUrl;
		this.fetchNextStatement();
	}

	fetchNextStatement() {
		this._loading = true;
		this._error = undefined;

		// If we have a pid (from a previous vote), filter by it to skip voted statements.
		// Otherwise, fetch without filter to get the first available statement.
		const pidParam =
			this.pid !== undefined ? `&not_voted_by_pid=${this.pid}` : '';
		const url = `${this.baseUrl}/api/v3/nextComment?conversation_id=${this.polisId}${pidParam}`;

		fetch(url, { credentials: 'omit' })
			.then((s) => {
				if (!s.ok) throw new Error(`nextComment failed: ${s.status}`);
				return s.json();
			})
			.then((comment) => {
				console.log('[PolisApi] nextComment:', comment);
				if (typeof comment.currentPid === 'number') {
					this.pid = comment.currentPid;
				}
				if (comment.txt) {
					this._currentStatement = comment;
					this._remaining = comment.remaining;
					this._total = comment.total;
					this._ready = true;
				} else {
					this._currentStatement = undefined;
					this._remaining = 0;
					this._ready = true;
				}
			})
			.catch((err) => {
				console.error('[PolisApi] Failed to fetch next statement:', err);
				this._error = err.message;
			})
			.finally(() => (this._loading = false));
	}

	submitStatement(statement: string) {
		if (this.pid === undefined) {
			console.warn('[PolisApi] Cannot submit statement before voting (no pid yet)');
			this._error = 'Vote on at least one statement before adding your own.';
			return;
		}
		this._loading = true;
		this._error = undefined;
		fetch(`${this.baseUrl}/api/v3/comments`, {
			method: 'POST',
			credentials: 'omit',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversation_id: this.polisId,
				txt: statement,
				pid: this.pid,
				xid: this.userId,
				vote: 0,
				is_seed: false
			})
		})
			.then((r) => {
				if (!r.ok) throw new Error(`submitStatement failed: ${r.status}`);
				return r.json();
			})
			.then((data) => {
				console.log('[PolisApi] Comment created:', data);
			})
			.catch((err) => {
				console.error('[PolisApi] Error submitting statement:', err);
				this._error = err.message;
			})
			.finally(() => (this._loading = false));
	}

	submitVote(vote: 'agree' | 'disagree' | 'pass') {
		if (!this.currentStatement) {
			console.error('[PolisApi] No current statement to vote on');
			return;
		}

		const votedTid = this.currentStatement.tid;
		this._loading = true;
		this._error = undefined;

		// Polis API: 1 = agree, -1 = disagree, 0 = pass ??
		const voteValue = { agree: 1, disagree: -1, pass: 0 }[vote];

		const voteRequest = fetch(`${this.baseUrl}/api/v3/votes`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'omit',
			body: JSON.stringify({
				agid: 1,
				conversation_id: this.polisId,
				tid: votedTid,
				vote: voteValue,
				xid: this.userId,
				...(this.pid !== undefined && { pid: this.pid }),
				high_priority: false,
				lang: this.lang
			})
		})
			.then((r) => {
				if (!r.ok) throw new Error(`submitVote failed: ${r.status}`);
				return r.json();
			})
			.then((data) => {
				console.log('[PolisApi] Vote response:', data);
				if (typeof data.currentPid === 'number') {
					this.pid = data.currentPid;
				}
			});

		if (this.pid !== undefined) {
			// Already have pid — fire nextComment in parallel with the vote
			const pidParam = `&not_voted_by_pid=${this.pid}`;
			const nextUrl = `${this.baseUrl}/api/v3/nextComment?conversation_id=${this.polisId}${pidParam}`;

			const nextRequest = fetch(nextUrl, { credentials: 'omit' })
				.then((r) => {
					if (!r.ok) throw new Error(`nextComment failed: ${r.status}`);
					return r.json();
				});

			// Wait for both, then check if server had recorded the vote in time
			Promise.all([voteRequest, nextRequest])
				.then(([_, comment]) => {
					console.log('[PolisApi] Parallel nextComment:', comment);
					if (typeof comment.currentPid === 'number') {
						this.pid = comment.currentPid;
					}
					if (comment.tid === votedTid) {
						// Server processed nextComment before recording the vote — retry once
						console.log('[PolisApi] Got same statement back, retrying...');
						this.fetchNextStatement();
						return;
					}
					if (comment.txt) {
						this._currentStatement = comment;
						this._remaining = comment.remaining;
						this._total = comment.total;
						this._ready = true;
					} else {
						this._currentStatement = undefined;
						this._remaining = 0;
						this._ready = true;
					}
					this._loading = false;
				})
				.catch((err) => {
					console.error('[PolisApi] Error in parallel vote+fetch:', err);
					this._error = err.message;
					this._loading = false;
				});
		} else {
			// First vote: must await to get pid before fetching next
			voteRequest
				.then(() => this.fetchNextStatement())
				.catch((err) => {
					console.error('[PolisApi] Error submitting vote:', err);
					this._error = err.message;
					this._loading = false;
				});
		}
	}

	get currentStatement() {
		return this._currentStatement;
	}

	get loading() {
		return this._loading;
	}

	get remaining() {
		return this._remaining;
	}

	get total() {
		return this._total;
	}

	get error() {
		return this._error;
	}

	get ready() {
		return this._ready;
	}

	get participantId() {
		return this.pid;
	}
}
