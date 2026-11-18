<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { QuestionVersionDto } from '@crownshy/api-client/api';
	import type { AboutYouQuestion } from '$lib/services/demographics';
	import AboutYouScreen from './AboutYouScreen.svelte';

	const { Story } = defineMeta({
		title: 'Screens/AboutYouScreen',
		component: AboutYouScreen,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});

	function question(
		version: Partial<QuestionVersionDto> & Pick<QuestionVersionDto, 'id' | 'text'>
	): AboutYouQuestion {
		return {
			version: {
				question_id: version.id,
				question_type: 'single_select',
				status: 'published',
				version_number: 1,
				updated_at: '2026-01-01T00:00:00Z',
				allow_other: false,
				prefer_not_to_say: false,
				special_category: false,
				options: [],
				...version
			},
			required: false,
			initial: {
				value: '',
				optionIds: [],
				other: false,
				otherText: '',
				preferNotToSay: false,
				consent: false
			}
		};
	}

	const questions = [
		question({
			id: 'age',
			text: 'What is your age?',
			question_type: 'number'
		}),
		question({
			id: 'housing',
			text: 'How do you describe your housing?',
			question_type: 'multi_select',
			allow_other: true,
			prefer_not_to_say: true,
			options: [
				{ id: 'rent', label: 'I rent', position: 0 },
				{ id: 'own', label: 'I own', position: 1 }
			]
		}),
		question({
			id: 'gender',
			text: 'What is your gender identity?',
			special_category: true,
			consent_text: 'I agree to share this answer.',
			options: [
				{ id: 'woman', label: 'Woman', position: 0 },
				{ id: 'man', label: 'Man', position: 1 }
			]
		})
	];
</script>

<Story name="Versioned questions" args={{ placeName: 'UTAH COUNTY', questions }}>
	{#snippet template(args)}
		<AboutYouScreen {...args} onDone={async () => ({ success: true, saved: [] })} />
	{/snippet}
</Story>
