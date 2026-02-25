<script lang="ts">
	interface Props {
		/** Whether to show the confetti */
		active: boolean;
		/** Number of particles */
		count?: number;
		class?: string;
	}

	let { active, count = 24, class: className = '' }: Props = $props();

	const colors = ['#07A89E', '#2DD4BF', '#FBBF24', '#FC3AA8', '#818CF8', '#FFFFFF'];
	const particles = Array.from({ length: count }, (_, i) => ({
		id: i,
		color: colors[i % colors.length],
		left: Math.random() * 100,
		delay: Math.random() * 500,
		size: 5 + Math.random() * 9,
		rotation: Math.random() * 360
	}));
</script>

<style>
	@keyframes confetti-fall {
		0% { transform: translateY(-20px) rotate(0deg) scale(0); opacity: 1; }
		15% { transform: translateY(0px) rotate(45deg) scale(1.2); opacity: 1; }
		100% { transform: translateY(600px) rotate(720deg) scale(0.3); opacity: 0; }
	}
	.confetti-piece {
		animation: confetti-fall 1.6s ease-out forwards;
	}
</style>

{#if active}
	<div class="pointer-events-none absolute inset-0 z-50 overflow-hidden {className}">
		{#each particles as p}
			<div
				class="confetti-piece absolute rounded-sm"
				style="left: {p.left}%; top: -20px; width: {p.size}px; height: {p.size}px; background: {p.color}; animation-delay: {p.delay}ms; transform: rotate({p.rotation}deg);"
			></div>
		{/each}
	</div>
{/if}
