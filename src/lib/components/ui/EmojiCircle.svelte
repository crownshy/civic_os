<script lang="ts">
	interface Props {
		/** Emoji character to display */
		emoji?: string;
		/** Size variant */
		size?: 'sm' | 'md' | 'lg' | 'xl';
		/** Background color - defaults to primary (teal) */
		bgColor?: string;
		/** Optional extra classes */
		class?: string;
	}

	let {
		emoji = '🎉',
		size = 'xl',
		bgColor = 'bg-primary',
		class: className = ''
	}: Props = $props();

	const sizeClasses = {
		sm: 'h-9 w-9',
		md: 'h-28 w-28',
		lg: 'h-30 w-30',
		xl: 'h-30 w-30'
	};

	const emojiSizeClasses = {
		sm: 'text-2xl',
		md: 'text-7xl',
		lg: 'text-9xl',
		xl: 'text-9xl'
	};
</script>

<div class="relative shrink-0 {className}">
	<div class="{sizeClasses[size]} rounded-full {bgColor}"></div>
	<span
		class="absolute inset-0 flex items-center justify-center {emojiSizeClasses[
			size
		]} drop-shadow-[0px_4px_24px_rgba(0,0,0,0.25)]"
	>
		{emoji}
	</span>
</div>
