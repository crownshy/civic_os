<script lang="ts">
	import '../../app.css';
	import { page } from '$app/state';

	let { form } = $props();

	const denied = $derived(page.url.searchParams.get('denied') === '1');
</script>

<div class="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
	<form method="POST" class="border-border bg-card w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm">
		<div class="flex items-center gap-2.5">
			<div class="bg-destructive size-8 shrink-0 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl"></div>
			<span class="text-lg font-bold">CivicOS Admin</span>
		</div>

		<div class="space-y-1.5">
			<label for="email" class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				value={form?.email ?? ''}
				class="border-border bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>

		<div class="space-y-1.5">
			<label for="password" class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				class="border-border bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>

		{#if denied}
			<p class="text-destructive text-sm">That account doesn't have admin access.</p>
		{/if}
		{#if form?.error}
			<p class="text-destructive text-sm">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-3 py-2 text-sm font-medium"
		>
			Sign in
		</button>
	</form>
</div>
