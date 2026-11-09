import type { UserOrganizationsResponse } from '@crownshy/api-client/api';
import type { BackendClient } from '$lib/server/backend-client';

declare global {
	namespace App {
		interface Locals {
			isAdmin: boolean;
			/** Talks to comhairle directly as the signed-in user. Not set on `/api/*`. */
			api: BackendClient;
			/** `GetUserOrganizations` for this request, fetched at most once. */
			userOrganizations: () => Promise<UserOrganizationsResponse>;
		}
	}
}

export {};
