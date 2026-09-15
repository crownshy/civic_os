import { buildReport } from '../../domain/report';
import bloomData from './bloom-data.json';
import insights from './bloom-insights.json';
import { REPORT_CONFIG } from './config';
import consensus from './consensus-statements.json';
import counties from './counties.json';
import demographics from './demographics.json';
import groupInfo from './group-info.json';
import groupStatements from './group-statements.json';
import participantLocations from './participant-locations.json';
import ctaImage from './sisters_bg.webp';
import titleImage from './sisters_title.webp';
import themeDescriptions from './theme-descriptions.json';

export const report = buildReport({
	slug: 'utah-ai',
	config: REPORT_CONFIG,
	images: { title: titleImage, cta: ctaImage },
	bloomData,
	insights,
	groupInfo,
	groupStatements,
	consensus,
	themeDescriptions,
	demographics,
	participantLocations,
	counties
});
