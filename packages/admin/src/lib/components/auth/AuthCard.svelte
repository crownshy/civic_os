<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		children,
		footer
	}: { title?: string; description?: string; children: Snippet; footer?: Snippet } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
	<div class="w-full max-w-sm space-y-4">
		<div class="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
			<div class="flex items-center gap-2.5">
				<div
					class="size-8 shrink-0 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl bg-primary"
				></div>
				<span class="text-body font-bold">CivicOS Admin</span>
			</div>

			{#if title}
				<div class="space-y-1">
					<h1 class="text-h4 font-semibold">{title}</h1>
					{#if description}<p class="text-body text-muted-foreground">{description}</p>{/if}
				</div>
			{/if}

			{@render children()}
		</div>

		{#if footer}
			<p class="text-center text-body text-muted-foreground">{@render footer()}</p>
		{/if}
	</div>
</div>
