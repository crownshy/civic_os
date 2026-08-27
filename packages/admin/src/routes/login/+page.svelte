<script lang="ts">
	import '../../app.css';
	import { page } from '$app/state';

	let { form } = $props();

	const denied = $derived(page.url.searchParams.get('denied') === '1');
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
	<form
		method="POST"
		class="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
	>
		<div class="flex items-center gap-2.5">
			<div
				class="size-8 shrink-0 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl bg-primary"
			></div>
			<span class="text-body font-bold">CivicOS Admin</span>
		</div>

		<div class="space-y-1.5">
			<label
				for="email"
				class="text-caption font-medium tracking-wider text-muted-foreground uppercase">Email</label
			>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				value={form?.email ?? ''}
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-body focus:ring-2 focus:ring-primary focus:outline-none"
			/>
		</div>

		<div class="space-y-1.5">
			<label
				for="password"
				class="text-caption font-medium tracking-wider text-muted-foreground uppercase"
				>Password</label
			>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-body focus:ring-2 focus:ring-primary focus:outline-none"
			/>
		</div>

		{#if denied}
			<p class="text-body text-destructive">That account doesn't have admin access.</p>
		{/if}
		{#if form?.error}
			<p class="text-body text-destructive">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-md bg-primary px-3 py-2 text-body font-medium text-primary-foreground hover:bg-primary/90"
		>
			Sign in
		</button>
	</form>
</div>
