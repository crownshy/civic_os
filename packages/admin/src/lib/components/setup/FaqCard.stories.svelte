<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FaqCard from '$lib/components/setup/FaqCard.svelte';
	import { faqAnswerToHtml } from '@civicos/shared/data/faq';

	const entry = (question: string, answer: string) => ({
		question,
		answer: faqAnswerToHtml(answer)
	});

	const { Story } = defineMeta({
		title: 'Setup/FaqCard',
		component: FaqCard,
		tags: ['autodocs'],
		args: {
			title: 'FAQ',
			subtitle:
				'Questions and answers shown on the Campaign homepage as an expandable list. Participants see them in the order set here.',
			entries: [
				entry(
					'Who can participate in this poll?',
					'Anyone who lives in the region can vote on statements and contribute their own thoughts.'
				),
				entry(
					'Are my responses anonymous?',
					'Yes. Your votes and any statements you submit are anonymous.\n\nIf you share an email, that is kept separate from your contributions.'
				)
			],
			onSave: async () => {}
		}
	});
</script>

<Story name="With questions" />

<!-- What a Campaign whose Host has never opened this card shows. -->
<Story name="Empty" args={{ entries: [] }} />

<!-- A multi-paragraph answer is one row, with the blank line preserved. -->
<Story
	name="Long answer"
	args={{
		entries: [
			entry(
				'What happens to the results?',
				'Results are published publicly when the conversation closes.\n\nThey also feed into the live conversations and the Solutions Forum later in the campaign.\n\nNothing is published while the poll is still open.'
			)
		]
	}}
/>
