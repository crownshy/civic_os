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
 *
 * Polis is a third-party service with its own API, so every call in here is a
 * raw fetch on purpose: the generated comhairle client does not cover it.
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
	pid = $state<number | undefined>(undefined);

	constructor(
		userId: string,
		polisId: string,
		lang: string = 'en',
		baseUrl: string = 'https://polis.comhairle.scot',
		initialPid?: number
	) {
		this.polisId = polisId;
		this.userId = userId;
		this.lang = lang;
		this.baseUrl = baseUrl;
		if (initialPid !== undefined) this.pid = initialPid;
		this.tryToGetPidForXid();
		this.fetchNextStatement();
	}

	tryToGetPidForXid() {
		fetch(
			`${this.baseUrl}/api/v3/participationInit?conversation_id=${this.polisId}&xid=${this.userId}`
		)
			.then((r) => r.json())
			.then((data) => {
				if (data.ptpt?.pid) {
					this.pid = data.ptpt.pid;
				}
			});
	}

	fetchNextStatement() {
		this._loading = true;
		this._error = undefined;

		// If we have a pid (from a previous vote), filter by it to skip voted statements.
		// Otherwise, fetch without filter to get the first available statement.
		const pidParam = this.pid !== undefined ? `&not_voted_by_pid=${this.pid}` : '';

		const url = `${this.baseUrl}/api/v3/nextComment?conversation_id=${this.polisId}${pidParam}`;

		fetch(url, { credentials: 'include' })
			.then((s) => {
				if (!s.ok) throw new Error(`nextComment failed: ${s.status}`);
				return s.json();
			})
			.then((comment) => {
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

	/**
	 * Resolves to the new statement's `tid` and the author's `pid`, or null when
	 * Polis refused it or did not report a `tid`. The caller needs both to create
	 * the `statement_aux` row admin moderation lists.
	 */
	async submitStatement(statement: string): Promise<{ tid: number; pid: number } | null> {
		this._loading = true;
		this._error = undefined;

		const authType = this.pid ? { pid: this.pid } : { xid: this.userId };

		try {
			const r = await fetch(`${this.baseUrl}/api/v3/comments`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					agid: 1,
					conversation_id: this.polisId,
					txt: statement,
					vote: -1,
					is_seed: false,
					...authType
				})
			});
			if (!r.ok) throw new Error(`submitStatement failed: ${r.status}`);
			const data = await r.json();
			if (typeof data.currentPid === 'number') {
				this.pid = data.currentPid;
			}
			if (typeof data.tid !== 'number') return null;
			return { tid: data.tid, pid: this.pid ?? 0 };
		} catch (err) {
			console.error('[PolisApi] Error submitting statement:', err);
			this._error = err instanceof Error ? err.message : String(err);
			return null;
		} finally {
			this._loading = false;
		}
	}

	submitVote(vote: 'agree' | 'disagree' | 'pass') {
		if (!this.currentStatement) {
			console.error('[PolisApi] No current statement to vote on');
			return;
		}

		const votedTid = this.currentStatement.tid;
		this._loading = true;
		this._error = undefined;

		const voteValue = { agree: -1, disagree: 1, pass: 0 }[vote];

		const authType = this.pid ? { pid: this.pid } : { xid: this.userId };

		fetch(`${this.baseUrl}/api/v3/votes`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({
				agid: 1,
				conversation_id: this.polisId,
				tid: votedTid,
				vote: voteValue,
				high_priority: false,
				lang: this.lang,
				...authType
			})
		})
			.then((r) => {
				if (!r.ok) throw new Error(`submitVote failed: ${r.status}`);
				return r.json();
			})
			.then((data) => {
				if (typeof data.currentPid === 'number') {
					this.pid = data.currentPid;
					this.fetchNextStatement();
				}
			})
			.catch((e) => console.log('Error with vote ', e));
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
