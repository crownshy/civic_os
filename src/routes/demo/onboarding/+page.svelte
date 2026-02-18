<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { PillButton, PillInput, MonoLabel, AvatarRow, QuoteText } from '$lib/components/ui';
	import { deliberation, avatarOptions } from '$lib/data/mock';
	import { page } from '$app/stores';

	// ?returning=true shows "Welcome Back" variant
	const isReturning = $derived($page.url.searchParams.get('returning') === 'true');

	let step = $state<'welcome' | 'info' | 'avatar'>('welcome');
	let name = $state('');
	let selectedAvatar = $state('');

	const welcomeTitle = $derived(isReturning ? 'WELCOME BACK :)' : 'WELCOME!');
</script>

<AppShell>
	{#if step === 'welcome'}
		<!-- Welcome / Welcome Back screen -->
		<div class="flex h-dvh flex-col bg-primary">
			<!-- Scrollable content -->
			<div class="flex flex-1 flex-col overflow-y-auto px-8">
				<p class="mt-20 font-mono text-4xl font-medium text-primary-foreground">
					{welcomeTitle}
				</p>

				<!-- Info bullets -->
				<div class="mt-16 text-md flex flex-col gap-6">
					<div class="flex items-start gap-4">
						<span class="mt-1 h-7 w-7 shrink-0 rounded-full bg-primary-foreground"></span>
						<p class="font-mono font-medium text-primary-foreground">
							THIS CONVERSATION IS ABOUT XYZ.
						</p>
					</div>
					<div class="flex items-start gap-4">
						<span class="mt-1 h-7 w-7 shrink-0 rounded-full bg-primary-foreground"></span>
						<p class="font-mono font-medium text-primary-foreground">
							SO FAR, WE'VE TALKED ABOUT {deliberation.topics.slice(0, 2).join(', ').toUpperCase()}, ETC.
						</p>
					</div>
					<div class="flex items-start gap-4">
						<span class="mt-1 h-7 w-7 shrink-0 rounded-full bg-primary-foreground"></span>
						<p class="font-mono font-medium text-primary-foreground">
							{#if isReturning}
								THIS IS YOUR SPACE TOO! KEEP IT CLEAN, HELP OTHERS OUT, ETC.
							{:else}
								YOU WILL SEE A BUNCH OF IDEAS AND OPINIONS FROM OTHER PEOPLE. YOU CAN VOTE AGREE OR DISAGREE ON THESE, AND/OR ADD YOUR OWN.
							{/if}
						</p>
					</div>
				</div>
			</div>

			<!-- Sticky bottom: avatar selection + email (new users only) + CTA -->
			<div class="shrink-0 pb-8">
				<MonoLabel size="md" variant="white" class="px-8 mb-4 block text-center">
					SELECT YOUR AVATAR
				</MonoLabel>
				<AvatarRow 
					avatars={avatarOptions}
					selected={selectedAvatar}
					onSelect={(id) => (selectedAvatar = id)}
				/>

				{#if !isReturning}
					<div class="mt-6 px-8">
						<PillInput
							placeholder="example@abc.com"
							bind:value={name}
							variant="on-primary"
						/>
					</div>
				{/if}
				<div class="mt-4 px-8">
					<PillButton
						variant="filled-white"
						fullWidth
						onclick={() => (step = 'avatar')}
					>
						LET'S GO!
					</PillButton>
				</div>
			</div>
		</div>

	{:else}
		<!-- Avatar confirmation → go to contribute -->
		<div class="flex h-dvh flex-col bg-primary">
			<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
				<div
					class="h-32 w-32 rounded-full"
					style="background-color: {avatarOptions.find(a => a.id === selectedAvatar)?.color ?? '#FFFFFF'};"
				></div>
				<QuoteText size="xl" variant="white" class="mt-8 text-center">YOU'RE IN!</QuoteText>
				<p class="mt-4 text-center font-mono text-lg font-medium text-primary-foreground">
					READY TO SHARE YOUR THOUGHTS?
				</p>
			</div>
			<div class="shrink-0 px-8 pb-8">
				<a href="/demo/contribute">
					<PillButton variant="filled-white" fullWidth>LET'S GO!</PillButton>
				</a>
			</div>
		</div>
	{/if}
</AppShell>
