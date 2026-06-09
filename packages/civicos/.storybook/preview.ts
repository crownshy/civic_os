import type { Preview } from '@storybook/sveltekit';
import '../src/routes/layout.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},

		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: 'todo'
		},

		viewport: {
			viewports: {
				mobile: { name: 'Mobile', styles: { width: '430px', height: '932px' } },
				tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
				desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } }
			},
			defaultViewport: 'mobile'
		}
	}
};

export default preview;
