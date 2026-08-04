import type { StorybookConfig } from '@storybook/sveltekit';
import { mergeConfig } from 'vite';
import { browserTestAliases } from '../env-alias';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@chromatic-com/storybook',
		'@storybook/addon-vitest',
		'@storybook/addon-a11y',
		'@storybook/addon-docs'
	],
	framework: '@storybook/sveltekit',
	viteFinal: async (viteConfig) => mergeConfig(viteConfig, { resolve: { alias: browserTestAliases } })
};
export default config;
