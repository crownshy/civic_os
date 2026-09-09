import { getContext, setContext } from 'svelte';

/**
 * How a page asks the report to move. The layout owns the one implementation
 * (route ids through `resolve`), and the pages under it just call this, so
 * nothing below the layout has to know what the URLs look like.
 */
export type Navigate = (key: string) => void;

const KEY = Symbol('bloom-report:navigate');

export function setNavigate(navigate: Navigate) {
	setContext(KEY, navigate);
}

export function getNavigate(): Navigate {
	return getContext<Navigate>(KEY);
}

/**
 * Opens the statement modal. `records` is the list the
 * modal pages through and `index` the one to show first.
 */
export type OpenStatement = (records: readonly unknown[], index: number) => void;

const OPEN_STATEMENT = Symbol('bloom-report:openStatement');

export function setOpenStatement(open: OpenStatement) {
	setContext(OPEN_STATEMENT, open);
}

export function getOpenStatement(): OpenStatement {
	return getContext<OpenStatement>(OPEN_STATEMENT);
}

/** Opens the opinion-group detail modal. */
export type OpenGroup = (key: string) => void;

const OPEN_GROUP = Symbol('bloom-report:openGroup');

export function setOpenGroup(open: OpenGroup) {
	setContext(OPEN_GROUP, open);
}

export function getOpenGroup(): OpenGroup {
	return getContext<OpenGroup>(OPEN_GROUP);
}

/** Opens the demographics detail modal. */
export type OpenDemographics = () => void;

const OPEN_DEMOGRAPHICS = Symbol('bloom-report:openDemographics');

export function setOpenDemographics(open: OpenDemographics) {
	setContext(OPEN_DEMOGRAPHICS, open);
}

export function getOpenDemographics(): OpenDemographics {
	return getContext<OpenDemographics>(OPEN_DEMOGRAPHICS);
}
