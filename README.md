# MOOI — Jou klerekas. Jou styl. Jou Mooi.

## Version 8

New signup continues from the private recovery-code screen into a three-slide app tutorial, followed by optional style questions. Replay the tutorial from Profile. Overview shortcuts have moved into that tour. Saved-item controls use custom outline SVG hearts.

Every account has a unique, case-insensitive username. Existing accounts receive an available handle based on their display name, and can change it in Profile. Friends search names or usernames; search results never include emails, wardrobe contents or personal photos. Accepted friendships still control outfit visibility.

Weather includes a browser-side Open-Meteo fallback when the hosting server cannot reach the provider, and known South African city centres if geocoding is unavailable. Outfit styling continues with an explicit weather-unavailable notice when needed. Generated JPEGs reduce storage size; provider errors distinguish access, credits and rate limits, and failed render status persists in PostgreSQL. API credentials remain server-only.

Sixteen automated checks cover account persistence, signup, usernames, social privacy, repeated generation, photo references, weather failure and existing calendar features. AI integration tests use a simulated provider; live AI depends on the connected account’s available quota.

## Version 7

Wardrobe is the main collection area with Wardrobe, Outfits and Wishlist tabs. Add and filter pieces there. Insights contains weather and wardrobe statistics. Calendar and Packing lists share a tab bar. The introduction and login use the transparent updated logo. The app also opens at `/jou-mooi`.

Hosted accounts use PostgreSQL when `DATABASE_URL` is set privately on the server. Passwords remain scrypt-hashed, session tokens are hashed, and each API response waits for its database transaction to commit. Local testing still uses the local JSON store if no database is configured. Accounts from a previous local or expired temporary installation are not automatically present in the new database; create a hosted account and import an exported wardrobe backup if needed.

This is a small pilot: the PostgreSQL adapter stores the collection in one transactional JSONB record and serialises account API requests, so long AI requests can delay other account requests. Static pages, health checks and weather remain available. Split storage by account and move garment photos to object storage before scaling. Free Render PostgreSQL expires on October 23, 2026; migrate or upgrade before that date. Free database backups must be arranged separately.

AI credentials belong only in Render's environment settings (`OPENAI_API_KEY`), never in browser code or this repository. Run `npm install` if using PostgreSQL outside Docker; Docker installs its locked dependencies automatically. Run `node --test --test-isolation=none tests/*.test.js` for checks.

The standalone marketing website ZIP includes an interactive overview phone demo with in-memory guest state. It contains no accounts or secrets and does not call the paid AI service. Host the extracted folder on a static host to use the module-based demo.

## Earlier release notes
# MOOI

## Version 6 — private phone-testing build

Start with [TEST-ON-PHONE.md](TEST-ON-PHONE.md) for local testing, private HTTPS hosting and installation on iPhone and Android. This release adds owned-only styling, locked pieces, feedback for future generations, automatic weather, batch photo review, item swaps, inspiration breakdown, owner-curated local product listings and password recovery codes. AI needs a configured paid API account. No public deployment has been performed.

The supplied Dockerfile and installable web app files prepare a small hosted pilot. Use persistent storage and one server instance. The guide explains remaining limits, external integrations and what must change before a public launch.

## Version 5 — your wardrobe, your style

Your supplied MOOI logo is used in the header, welcome screen and login. New accounts open a style slideshow with optional questions, Back/Next controls and a final Save. Existing users can open it from Profile → Photo & style questions. Sign out is at the top of Profile.

Calendar now has month navigation and clickable dates. Create an outfit in Outfits first, then tap a day to assign, change or remove it. Packing lists remain in the calendar’s three-dot menu. Insights includes live weather, wardrobe statistics, your clothing collection and Add a piece. Outfits has tabs for Your outfits, Wishlist and Inspiration. The Generate form has no shopping budget field. Friend invitations and popup forms use the warm MOOI design.

Open http://127.0.0.1:8787/?v=5 after starting the app. API-backed AI still requires your own configured key; friend connections are local to this installation.

## Version 4 — warm neutrals and bottom navigation

The supplied colour reference is applied across the app with ivory, sand, taupe and warm brown. Custom drawn icons form the five-item bottom navigation: Calendar, Insights, Generate in the centre, Outfits, Feed & friends. The calendar's three-dot menu opens Packing lists. Outfits initially displays saved favourites; choose All for the full studio. Your profile and notifications remain at the top right. Click the Closet wordmark to return to the overview.

An introductory photo with animated script transitions into login or, for a valid session, directly into the app. Skip intro and reduced-motion preferences are supported. Remember me keeps the session cookie for 30 days; otherwise a browser-session cookie is issued with a 12-hour server expiry. Browser session-restore behaviour can preserve session cookies. Sign out explicitly on shared devices.

Notifications use dark brown for owner announcements, sand for friends' posts and pale ivory for friend requests, with text labels and per-account unread state. They refresh on opening, when returning to the tab, and every minute while visible. Only accepted friends' posts appear. Removing a friend revokes feed and notification access.

To enable the owner's announcement composer, set `CLOSET_OWNER_EMAIL` in the private `.env` file to the exact email of the owner's registered account, then restart the server. No account receives owner rights automatically. The owner opens Notifications → Write an announcement to compose and publish to accounts on this installation. This local app still requires hosting for users on separate devices.

## Version 3.1

The login photograph is shown uncropped. Profile & settings is opened from the top-right avatar rather than the navigation drawer. The overview displays current modelled weather and today's forecast for the South African city in Profile, provided by Open-Meteo. No device location permission is requested. Forecast responses are cached for 15 minutes; failures show a retry option rather than made-up weather. The stylist's manual weather choice remains independently adjustable.

## September redesign — version 3

Open **http://127.0.0.1:8787/?v=3** for the updated app. The previous tab at port 8765 may still display the old version. Navigation is now a hidden, keyboard-accessible drawer opened by the top-left menu icon. The overview has an editorial layout; “Style my day” opens the outfit-generation form.

### Friends and outfit sharing

Open Friends & feed from the menu. Each signed-in account gets a friend code. Exchange codes yourselves, send a request and accept it on the other account. Only accepted friends and the author can see shared posts. Choose “Share a look”, review the sharing preview, and confirm. No outfits are shared automatically. Remove a friend to revoke their access, or stop sharing a post to remove it from the feed.

Posts contain only the chosen outfit snapshot: display name, caption, selected visual, and clothing names, colours, brands and photos. Account emails, sizes, other wardrobe pieces and private profile fields are not included. Choosing a try-on image shares that image of your likeness. Downloaded copies cannot be recalled.

Click a shared outfit to compare it with your wardrobe. Suggestions use category, colour and description similarity, exclude laundry, and are labelled as approximate. “Create my version” saves an editable private outfit with available substitutions and suggested additions. Local shopping links are retailer-scoped searches, not verified product listings.

The social flow works between accounts on **the same installation**. This app still binds to your computer’s loopback address. Friends on other phones or computers cannot connect until a hosted version with production authentication and storage is deployed. No public hosting was added by this update.

## Outfit studio

The Outfit studio adapts the supplied video features to Closet: browsable personal looks, a tappable strip of every owned and suggested piece, accessory details, South African retailer searches, wishlist saving, and a separate “Try on me” image with a comparison view. It does not import the videos' people, wardrobes, social counts or product listings.

Build a look from your wardrobe or use “Edit pieces & accessories” on an existing look. Each edit saves a new version and preserves the original. Bags, jewellery, belts, hats, eyewear, scarves and socks/tights have their own wardrobe categories, also available to AI tagging and styling. Existing generic accessories remain in Other accessories until you recategorise them.

Try-on requires your signed-in account, a personal photo with image-use enabled in Profile, and a connected AI key. The original outfit visual stays available beside the new try-on. Shopping links search the named retailer; they do not claim verified stock or exact products.

Run **Start-Closet.cmd**, keep its window open, then visit http://127.0.0.1:8787. No npm install is required. Node.js 22+ is required (the launcher also finds this computer's bundled Codex runtime).

Create an account and select Female, Male or Unspecified. Accounts and wardrobes are stored locally in `.closet-data`; this is not a publicly hosted authentication service. Back up that folder privately. Guest mode saves only in this browser. There is no email password recovery.

## Enable real AI

Copy `.env.example` to `.env`. Edit `.env` in a text editor and add your own OpenAI API key after `OPENAI_API_KEY=`. Restart the server. Never send the key in chat or enter it into the website. API usage is billed separately from ChatGPT. Model access depends on the API account.

The overview generates three new outfit combinations and optionally three model images. The first two combinations must contain an available owned item. Uploaded garment photos are sent to the image API as references; visuals may still differ from the real garment and are not a fit guarantee. Upload photos to all owned pieces used in a look before generating its model image. You can retry a failed image from outfit details or generate a new batch from the overview.

Photo tagging suggests editable details before confirmation. Pinterest links are saved references; the app does not scrape or sync Pinterest accounts. Upload a reference image and notes for visual inspiration. Suggested shopping links are retailer-restricted searches, not verified exact-product or stock links.

## Personal style setup

After signing in, users who have not completed setup can upload an optional fully clothed reference photo and answer questions about their lifestyle, preferred styles and colours, comfort, dislikes, goals and budget. Reopen this at Profile & settings → Photo & style questions. Photo analysis requires an explicit sharing choice and returns editable, approximate silhouette and fit suggestions; it does not measure the body. A separate optional choice includes the saved personal photo in future image-generation requests. Photo analysis and garment detection require the configured API connection. Removing the photo and saving stops future use; previously generated images and exported backups are separate copies.

The login has a short entrance animation with reduced-motion support and an original AI-generated editorial image. This built-in generated asset is included in the app; the app itself cannot call the Codex conversation's image tool. Ongoing personalised image generation uses the server API connection.

## Previous wardrobe

On the same browser origin as the previous app, Profile & settings offers **Import previous wardrobe** when the original `closet-studio-v1` data is present. Browser storage is specific to the port: if the old app was at port 8765, export its backup there, then import the JSON in the new app at port 8787. Import replaces the active collection after confirmation. The original storage key is never deleted.

Use Profile & settings to export backups. Original app files are retained in `index-legacy-backup.html` and `server-legacy-backup.js` in the working folder. Do not expose this local server or its data folder to the internet; public hosting requires production authentication, HTTPS and a database.

Run `npm test` (or `node --test tests/server.test.js`) for integration checks. These use a simulated AI provider; live paid AI calls require a configured key.
