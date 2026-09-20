# Test MOOI on iPhone and Android

MOOI is prepared as an installable web app (PWA). You do not need an App Store or Google Play release for the first tests. It has not been published yet.

## Try it on this computer now

1. Run `Start-Closet.cmd` from the app folder. Keep it running.
2. Open http://127.0.0.1:8787/?v=6 in Chrome or Edge.
3. Sign in, or create an account. Save the private recovery code when shown.
4. Existing accounts can create a recovery code in Profile using their current password.
5. Add your pieces in Insights. Try the batch upload with a few photos, one item per image.

Your local accounts remain on this computer. The phone's localhost address does not point to this computer.

## Put the private test version online

A Node-compatible HTTPS server with persistent storage is required. Render is one option; another host with the same capabilities is also suitable. Hosting and AI can incur charges. This guide does not purchase or deploy anything.

1. Extract `MOOI-Test-App.zip`. Create a private GitHub repository and upload the extracted app files. Keep files at the repository root. Do not upload `.env`, `.closet-data`, account backups, personal photos or recovery codes. The supplied ZIP excludes those private files.
2. In Render, create a Web Service connected to that repository. Choose the Docker runtime; the supplied Dockerfile starts the app. Use one instance only.
3. Choose a service plan supporting a persistent disk. Mount the disk at `/data`. Do not skip this: without persistent storage, account data can disappear when the server is redeployed.
4. Add these environment settings in the hosting dashboard:
   - `PUBLIC_ORIGIN`: the exact HTTPS service URL shown by your host, without a trailing slash, e.g. `https://your-mooi-service.onrender.com`.
   - `PILOT_CODE`: a long, private invitation code of at least 12 characters, shared only with your testers.
   - `DATA_DIR`: `/data`.
   - `PORT`: `8787`.
   - `CLOSET_OWNER_EMAIL`: the exact email you will use for your owner account.
   - `OPENAI_API_KEY`: your own secret API key. Testers do not need a key.
   - `OPENAI_MODEL` and `OPENAI_IMAGE_MODEL`: use models available to your API account; see `.env.example` for the configured defaults. Access must be checked on your account.
   - `AI_DAILY_LIMIT`: start with `20` for a small pilot. This limits requests per account, not money. A batch outfit request and its three image requests consume four requests. Limits reset on server restart.
5. Set the health check path to `/api/health`. Deploy. If the host assigned the service URL after creation, update `PUBLIC_ORIGIN` to that URL and redeploy.
6. Open the HTTPS address, create your account using the invitation code, and save your recovery code. Then share the HTTPS URL and invitation code privately with testers.

The hosted instance starts with its own collection of accounts. Your local account is not automatically transferred. Export your local wardrobe in Profile, create your hosted account, then import the backup into it. Keep that backup private.

## Install on iPhone

Open the hosted HTTPS link in **Safari**. Tap **Share → Add to Home Screen**. Enable **Open as Web App** if offered, then tap **Add**. Open the MOOI icon on your home screen and sign in.

## Install on Android

Open the hosted HTTPS link in **Chrome**. Open the browser menu and choose **Install app** or **Add to Home screen**, then confirm. You can also try **Profile → Install / how to install** in MOOI.

Browser labels vary. MOOI uses a neutral M monogram as its home-screen icon and your supplied full logo inside the app. Installation does not make generation, weather or account updates work offline. An offline screen explains how to reconnect.

## A first test with two people

- Create separate accounts and complete the multiple-choice setup.
- Upload 5–10 real pieces each. Confirm the AI's suggestions rather than assuming they are correct.
- Generate three looks, try Only use clothes I own, lock an item, and give feedback.
- Open an outfit and swap one piece. Confirm the original remains saved and the new version needs a fresh image.
- Schedule an outfit for today and check the overview.
- Save an inspiration image, choose Find my version, and review the approximate wardrobe matches.
- Exchange friend codes, accept the request, and deliberately share an outfit. Check visibility from the other account.
- Sign out, sign back in, and confirm the collection is retained. Reopen from the installed phone icon.
- Keep each tester's device type, what failed, and whether they would actually wear the outfit. Never include recovery codes or API keys in bug reports.

## What is implemented, and what still needs outside services

Implemented: optional multiple-choice onboarding, batch photos with individual review, AI tagging, owned-only generation, locked pieces, live weather in generation, remembered feedback, same-category item swaps, inspiration image breakdown, calendar, private friends, recovery codes, installable app files, hosted origin controls and owner-curated product imports.

AI needs a working paid API connection. The code has automated tests using simulated AI responses, but a live paid generation has not been verified on your account. Image previews are not exact fit measurements. Each uploaded batch photo is one piece; multi-garment segmentation and automatic background removal are not implemented.

The app does not have automatic retailer inventory, price alerts, direct Pinterest board access, email resets, public creator discovery or a full Afrikaans interface. Real retailer feeds/permissions are needed for reliable stock, price and size updates. Pinterest links are references; uploaded images are what the AI can inspect. Existing friends can share across devices once everyone uses the same hosted server.

This is a small private pilot, not a production-scale launch. It uses a single-server JSON database and embedded photos, not cloud object storage or a scalable database. Back up the persistent disk; move to managed database/object storage, monitoring, account deletion tools and a privacy/security review before wider release. Notifications update while the app is open; these are not phone push notifications. API request caps are held in memory and are not billing controls.

## Owner-curated local product listings

Set the owner email, then use Profile → Import catalogue JSON. `catalogue-template.json` starts empty intentionally. An import replaces the catalogue. Each entry needs:

```json
{
  "products": [
    {
      "name": "The actual checked product title",
      "category": "top",
      "retailer": "Bash",
      "url": "https://bash.com/replace-with-real-product-path",
      "price": 0,
      "sizes": ["Replace with checked sizes"],
      "checkedAt": "2026-09-20T08:00:00.000Z",
      "delivery": "Replace with checked delivery information"
    }
  ]
}
```

This is a format example, not a real product. Replace every example value before importing. Supported retailers and categories are defined in `shared.js`. Listings are category alternatives, not AI-verified exact visual matches. Every listing shows when its details were checked.

References: [Render web services](https://render.com/docs/web-services), [persistent disks](https://render.com/docs/disks), [Docker hosting](https://render.com/docs/docker), [Apple home-screen web apps](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios), [web app installation](https://web.dev/learn/pwa/installation).
