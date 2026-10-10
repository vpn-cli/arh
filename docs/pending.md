## Pinterest slideshow (blocked until the site is hosted)
- Code is done: scripts/sync_pinterest_board.ts (with --list-boards),
  HeroSlideshow, /privacy page. Manual images work today via
  `npm run slideshow` from assets-src/slideshow/.
- To finish:
  1. Host the site, then replace CONTACT_EMAIL in
     src/app/privacy/page.tsx.
  2. Pinterest: business account, My apps > Connect app. Answers:
     Personal API access; shared with no one; Use case Other ("read
     images from my own board for a slideshow on my personal site");
     Audience Other ("only me"); Reads Pins/Boards: "Yes, mine".
     Privacy link: https://<domain>/privacy.
  3. After approval: Manage > Configure > Generate Access Token
     (production-limited, not sandbox; expires in 24 hours).
  4. Put PINTEREST_ACCESS_TOKEN in .env.local, run --list-boards,
     set PINTEREST_BOARD_ID, run the sync, commit public/slideshow/
     and src/config/slideshow.ts.
  5. Check Pinterest's Developer Guidelines on storing image copies.

## Also blocked until hosting
- Installing the desktop app on her machine (needs HTTPS).
- Adding her Spotify account to the app's user list and the
  production redirect URI in the Spotify dashboard.
