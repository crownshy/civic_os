import { describe, it, expect } from 'vitest';
import { permissionDenied, polisFailure } from './describe-failure';

describe('polisFailure', () => {
	it('uses the permission sentence on a 403', () => {
		expect(polisFailure({ response: { status: 403 } }, 'sync statements from Polis')).toBe(
			'You do not have permission to sync statements from Polis. Ask the Campaign owner to give you a role on this Campaign.'
		);
	});

	it("names a misconfigured Polis step on a 422, with Comhairle's reason", () => {
		const error = {
			response: { status: 422, data: { err: 'Workflow Step has wrong type expected Polis' } }
		};
		expect(polisFailure(error, 'x')).toBe(
			`This conversation's Polis step is not set up correctly. Comhairle said: "Workflow Step has wrong type expected Polis".`
		);
	});

	it('still names the step when the 422 has no reason', () => {
		expect(polisFailure({ response: { status: 422 } }, 'x')).toBe(
			"This conversation's Polis step is not set up correctly."
		);
	});

	it('leaves every other failure to the caller', () => {
		expect(polisFailure({ response: { status: 500 } }, 'x')).toBeNull();
		expect(polisFailure(new Error('network'), 'x')).toBeNull();
	});
});

describe('permissionDenied', () => {
	it('names the action on a 403', () => {
		expect(permissionDenied({ response: { status: 403 } }, 'launch this poll')).toBe(
			'You do not have permission to launch this poll. Ask the Campaign owner to give you a role on this Campaign.'
		);
	});

	it('leaves every other failure to the caller', () => {
		expect(permissionDenied({ response: { status: 401 } }, 'x')).toBeNull();
		expect(permissionDenied({ response: { status: 500 } }, 'x')).toBeNull();
		expect(permissionDenied(new Error('network'), 'x')).toBeNull();
	});
});
