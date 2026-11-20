# One Comhairle-derived session across CivicOS apps

A Host signed in to CivicOS Admin is signed in to every other CivicOS app on
the same parent domain, and the reverse. The session is a single cookie that
each app's server reads and writes. It carries Comhairle's auth token.

This will allow us to share a single sign-on experience across all the CivicOS
apps.

