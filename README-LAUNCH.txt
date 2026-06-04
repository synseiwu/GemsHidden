Gems Hidden launch handoff

1) Open config.js
2) Replace siteUrl with your real domain
3) Replace supportEmail with your real business email
4) Paste your 5 Stripe payment links
5) Create a Supabase project and paste:
   - auth.supabaseUrl
   - auth.supabaseAnonKey
6) In Supabase Auth, set your site URL and redirect URL to your live domain/account.html
7) In Stripe, set your success URL to your-domain/success.html
8) In Stripe, set your cancel URL to your-domain/cancel.html
9) Replace privacy.html and terms.html with your final legal wording
10) Upload all files to your host

Notes:
- If Supabase keys are not added yet, signup/signin falls back to demo mode so you can still preview the UI.
- The site branding is now Gems Hidden.
- Payment links are centralized in config.js.
