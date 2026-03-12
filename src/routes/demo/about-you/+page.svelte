<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import AboutYouScreen from '../contribute/AboutYouScreen.svelte';
	import { county, aboutYouQuestions } from '$lib/data/mock';


</script>

<AppShell>
	<AboutYouScreen
		countyName={county.name}
		questions={aboutYouQuestions}
		zipCode=""
		onDone={() => console.log('Done')}
	/>
</AppShell>
