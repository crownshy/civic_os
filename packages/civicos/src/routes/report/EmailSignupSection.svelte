<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { Input } from '@civicos/shared/ui/input';

	let email = $state('');

	function handleSubmit() {
		if (email) {
			console.log('Email submitted:', email);
		}
	}
</script>

<section class="bg-background px-7 py-6">
	<div class="flex flex-col items-start gap-4">
		<p class="text-center font-sans text-base leading-6 text-muted-foreground">
			<span class="font-bold">Share your email</span> to receive updates on this conversation and opportunities
			to share your voice on this issue.
		</p>

		<div class="flex w-full flex-col gap-1.5">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="flex items-center overflow-hidden rounded-full bg-card px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
			>
				<div class="mr-2.5 h-4 w-4 shrink-0 bg-foreground"></div>
				<Input
					bind:value={email}
					type="email"
					placeholder="email@xyz.com"
					class="w-full rounded-none border-0 bg-transparent p-0 font-sans text-lg font-medium text-muted-foreground shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-0"
				/>
			</form>

			<Button variant="primary" fullWidth onclick={handleSubmit}>SIGN UP FOR UPDATES</Button>
		</div>
	</div>
</section>
