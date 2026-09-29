# MOOI 9.1 — wardrobe mixes, friends and calendar occasions

Generate now makes free combinations from available wardrobe pieces. It returns three distinct outfits when enough combinations satisfy the selected clothing, colour, locked pieces, weather and comfort preferences. Smaller wardrobes get an explanation instead of duplicated or invented garments.

Open a friend's shared outfit in Feed & friends to compare it with your wardrobe, find missing pieces locally, and choose **See this outfit on me**. Matching pieces are alternatives, not a claim that you own the exact product. AI previews require your consented profile photo and available API credits. Retailer searches are labelled separately from catalogue product pages; live stock is not guaranteed.

Uploaded garment details remain editable after AI suggestions. Automatic detection needs a working AI connection; manual entry remains available.

## Calendar setup

Open **Calendar → Phone calendar**. Signed-in users can connect a published/read-only Apple/iCloud, Google Calendar or Outlook ICS feed. Other providers can use a calendar file export. This is not private-account OAuth or direct access to the phone's calendar store.

Published links may make calendar contents accessible to anyone with the link. Prefer a separate occasions calendar or import a file. MOOI stores only event names and dates from events, and keeps the connection link outside the normal wardrobe export and status response. Disconnect stops future refreshes; imported events and outfits remain.

Linked feeds refresh on sign-in/app opening, when the app becomes visible, and every 15 minutes while visible. Use Refresh now for an immediate update. There is no guaranteed background refresh while the app is closed. File imports are one-time copies with an event-selection preview.

New or changed event dates prepare one free wardrobe outfit per day, preserving manually selected plans. Opening that day reveals the prepared outfit. Event names suggest an occasion, which users can adjust. No paid model images are automatically generated. Add wardrobe pieces before connecting a calendar, and check the weather and dress code nearer the event.

The importer reads up to 100 upcoming events for the next year, supports basic yearly birthday recurrence and explicit additional/excluded dates, and warns when recurrence is unsupported. It does not implement every calendar recurrence/time-zone rule. Multiple events on one day share one outfit plan.

## Validation

31 automated tests passed, including generation constraints, calendar parsing/sync/consent, access-controlled friend previews, concurrent saves, account isolation and existing features. AI and calendar-provider calls in tests use fixtures/mocks, with no paid AI calls. Browser checks covered three free mixes and importing a birthday with an immediately available planned outfit.

No paid service or database change is included. The existing temporary database still needs migration before its expiry. Real provider feeds and paid AI generation require the user's configured services and have not been tested against a personal calendar in this release.
