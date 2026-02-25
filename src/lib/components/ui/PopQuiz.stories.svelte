<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PopQuiz from './PopQuiz.svelte';

	const { Story } = defineMeta({
		title: 'Composites/PopQuiz',
		component: PopQuiz,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});

	const quiz = {
		id: 'quiz-001',
		label: 'POP QUIZ',
		question: 'What percentage of people do you think trust AI more than their elected officials?',
		options: ['Less than 30%', '50-70%', 'More than 70%'],
		correctIndex: 2,
		explanation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus purus mollis, ultrices lorem quis, facilisis mauris.'
	};
</script>

<Story name="Default" args={{ quiz }}>
	{#snippet children(args)}
		<div class="h-[932px] bg-linear-to-b from-blue-800 to-blue-900">
			<PopQuiz {...args} />
		</div>
	{/snippet}
</Story>
