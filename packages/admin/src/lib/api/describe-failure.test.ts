import { describe, it, expect } from 'vitest';
import { permissionDenied } from './describe-failure';

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
