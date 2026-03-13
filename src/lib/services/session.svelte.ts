import { api, config } from './api';

export interface UserProfile {
	id: string;
	userId: string;
	consented: boolean;
	ethnicity?: string | null;
	age?: number | null;
	gender?: string | null;
	zipcode?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	id: string;
	authType: string;
	username?: string | null;
	email?: string | null;
	emailVerified: boolean;
}

const STORAGE_KEY = 'civic-os-session';

function loadPersistedSession(): { userId?: string; emailProvided?: boolean; zipCode?: string; pid?: number; demographicsCompleted?: boolean } {
	if (typeof window === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

class Session {
	user = $state<User | null>(null);
	profile = $state<UserProfile | null>(null);
	emailProvided = $state(false);
	zipCode = $state('');
	pid = $state<number | undefined>(undefined);
	demographicsCompleted = $state(false);
	error = $state<string | null>(null);
	loading = $state(false);

	constructor() {
		const saved = loadPersistedSession();
		console.log('[Session] Restored from localStorage:', { userId: saved.userId, pid: saved.pid, demographicsCompleted: saved.demographicsCompleted, emailProvided: saved.emailProvided });
		if (saved.userId) {
			this.user = { id: saved.userId, authType: 'anonymous', emailVerified: false };
		}
		if (saved.emailProvided) this.emailProvided = true;
		if (saved.zipCode) this.zipCode = saved.zipCode;
		if (saved.pid !== undefined) this.pid = saved.pid;
		if (saved.demographicsCompleted) this.demographicsCompleted = true;
	}

	private persist() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				userId: this.user?.id,
				emailProvided: this.emailProvided,
				zipCode: this.zipCode,
				pid: this.pid,
				demographicsCompleted: this.demographicsCompleted
			}));
		} catch { /* ignore */ }
	}

	get conversationId() {
		return config.conversationId;
	}

	get inviteId() {
		return config.inviteId;
	}

	get userId() {
		return this.user?.id ?? null;
	}

	get isAuthenticated() {
		return this.user !== null;
	}

	get hasSession() {
		return this.user !== null && !!this.zipCode;
	}

	savePid(pid: number) {
		this.pid = pid;
		this.persist();
	}

	markDemographicsCompleted() {
		this.demographicsCompleted = true;
		this.persist();
	}

	async join(zipCode: string, email?: string): Promise<boolean> {
		this.loading = true;
		this.error = null;
		this.zipCode = zipCode;

		try {
			// 1. Create anonymous user (sets auth-token cookie)
			const user = await api.SignupAnnonUser(undefined, {});
			this.user = user;
			this.persist();

			// 2. Accept the invite (registers user for the workflow)
			if (this.conversationId && this.inviteId) {
				await api.AcceptInvite(undefined, {
					params: {
						conversation_id: this.conversationId,
						invite_id: this.inviteId
					}
				});
			}

			// 3. Save zipcode to profile (non-fatal — don't block flow if it fails)
			if (zipCode) {
				this.saveProfile({ zipcode: zipCode });
			}

			// 4. Register email if provided (non-fatal)
			if (email) {
				this.registerEmail(email);
			}

			return true;
		} catch (e) {
			console.error('[Session] Failed to join:', e);
			this.error = e instanceof Error ? e.message : 'Failed to join conversation';
			return false;
		} finally {
			this.loading = false;
		}
	}

	async registerEmail(email: string): Promise<boolean> {
		this.emailProvided = true;
		this.persist();

		if (!this.conversationId || !email) return false;

		try {
			await api.RegisterEmailForUpdates(
				{
					email,
					receive_updates_by_email: true,
					receive_similar_conversation_updates_by_email: false
				},
				{
					params: { conversation_id: this.conversationId }
				}
			);
			return true;
		} catch (e) {
			console.error('[Session] Failed to register email:', e);
			return false;
		}
	}

	async saveProfile(data: {
		zipcode?: string;
		age?: number;
		ethnicity?: string;
		gender?: string;
		consented?: boolean;
	}): Promise<boolean> {
		try {
			const res = await fetch('/api/user/profile', {
				method: 'PUT',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					zipcode: data.zipcode ?? null,
					age: data.age ?? null,
					ethnicity: data.ethnicity ?? null,
					gender: data.gender ?? null,
					consented: data.consented ?? true
				})
			});
			if (!res.ok) throw new Error(`UpsertUserProfile failed: ${res.status}`);
			this.profile = await res.json();
			return true;
		} catch (e) {
			console.error('[Session] Failed to save profile:', e);
			return false;
		}
	}

	async setStepProgress(
		workflowId: string,
		workflowStepId: string,
		status: 'not_started' | 'in_progress' | 'done'
	): Promise<boolean> {
		if (!this.conversationId || !workflowId) return false;

		try {
			await api.SetUserProgress(status, {
				params: {
					conversation_id: this.conversationId,
					workflow_id: workflowId,
					workflow_step_id: workflowStepId
				}
			});
			return true;
		} catch (e) {
			console.error('[Session] Failed to set progress:', e);
			return false;
		}
	}
}

export const session = new Session();
