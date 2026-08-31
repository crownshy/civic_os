<script lang="ts">
	import InfoBar from '$lib/components/ui/InfoBar.svelte';
	import Badge from '@civicos/shared/ui/Badge.svelte';

	interface Props {
		title: string;
		region: string;
		phase: string;
		description: string;
	}

	let { title, region, phase, description }: Props = $props();
</script>

<section
	class="relative min-h-dvh flex-col overflow-hidden"
	style="background: var(--gradient-hero);"
>
	<InfoBar countyName={region} variant="light" buttonText="LEARN MORE →" />

	<div class="mt-16 px-8">
		<Badge variant="dark" size="lg" class="px-7">{phase}</Badge>
	</div>

	<h1
		class="mt-4 px-8 font-display text-5xl leading-[1.01] font-medium tracking-display text-primary-foreground"
	>
		{title}
	</h1>

	<p class="mt-8 px-8 font-sans text-base leading-6 font-medium text-primary-foreground">
		{description}
	</p>

	<div class="bubble-scene">
		<div class="bubble-grid">
			<div class="col col-outer-l">
				<div class="bubble b-sm"></div>
			</div>

			<div class="col col-mid-l">
				<div class="bubble b-md"></div>
				<div class="bubble b-md"></div>
			</div>

			<div class="col col-center">
				<div class="bubble b-md"></div>
				<div class="bubble b-lg"></div>
			</div>

			<div class="col col-mid-r">
				<div class="bubble b-md"></div>
				<div class="bubble b-md"></div>
			</div>

			<div class="col col-outer-r">
				<div class="bubble b-sm"></div>
			</div>
		</div>
	</div>
</section>

<style>
	:root {
		--b-sm: 17vw;
		--b-md: 23vw;
		--b-lg: 31vw;
		--gap: 2vw;
	}

	@media (min-width: 768px) {
		:root {
			--b-sm: 6rem;
			--b-md: 8rem;
			--b-lg: 10rem;
			--gap: 0.9rem;
		}
	}

	.bubble-scene {
		pointer-events: none;
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100vw;
		height: calc(var(--b-lg) * 2.2);
		overflow: hidden;
	}

	.bubble-grid {
		position: absolute;
		bottom: calc(var(--b-md) * -0.4);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: flex-end;
		gap: var(--gap);
	}

	.col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--gap) * 3);
	}

	.col-outer-l {
		padding-bottom: calc(var(--b-md) * 0.7);
	}
	.col-center {
		padding-bottom: calc(var(--b-sm) * 0.5);
	}
	.col-outer-r {
		padding-bottom: calc(var(--b-md) * 0.7);
	}

	.bubble {
		border-radius: 9999px;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
		flex-shrink: 0;
	}

	.b-sm {
		width: var(--b-sm);
		height: var(--b-sm);
	}
	.b-md {
		width: var(--b-md);
		height: var(--b-md);
	}
	.b-lg {
		width: var(--b-lg);
		height: var(--b-lg);
	}
</style>
