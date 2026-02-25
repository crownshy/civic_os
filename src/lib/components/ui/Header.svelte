<script lang="ts">
	interface Props {
		countyName: string;
		class?: string;
	}

	let { countyName, class: className = '' }: Props = $props();
</script>

<div class="shrink-0 px-8 pt-6 {className}">
	<div class="flex items-center justify-between">
		<span class="font-mono text-sm font-medium text-white/80">{countyName}</span>
		<span class="flex items-center gap-2">
			<span class="h-3 w-3 rounded-full border border-white bg-secondary"></span>
			<span class="font-mono text-sm font-medium text-white/80">YOU</span>
		</span>
	</div>
</div>
