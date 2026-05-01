You are a senior UI/UX engineer and front-end developer. I have a web app called PaperWeave — an AI-powered literature review workspace for students and researchers. Users upload research papers (PDFs), get AI-extracted insights, discover connections between papers, and generate structured literature reviews.

I want you to redesign the entire frontend based on the design system below. Keep all existing functionality, only change the visual design.

━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━
Style: Calm Academic + Swiss Editorial
Mood: Serious but not intimidating. Like a modern library or Notion. Clean, focused, typographic.
References: Elicit.org, Readwise Reader, Zotero Web

━━━━━━━━━━━━━━━━━━━━━━━━━━
COLOR TOKENS
━━━━━━━━━━━━━━━━━━━━━━━━━━
Light mode:
  --bg: #f7f6f2           (warm off-white background)
  --surface: #f9f8f5      (card/panel background)
  --text: #28251d         (primary text)
  --text-muted: #7a7974   (secondary text, labels)
  --text-faint: #bab9b4   (placeholder, timestamps)
  --primary: #01696f      (teal — buttons, links, active state)
  --primary-bg: #cedcd8   (teal highlight — badges, active nav)
  --border: rgba(40,37,29,0.1)
  --divider: #dcd9d5

Dark mode:
  --bg: #171614
  --surface: #1c1b19
  --text: #cdccca
  --text-muted: #797876
  --primary: #4f98a3
  --primary-bg: #313b3b
  --border: rgba(255,255,255,0.08)

Use 1 accent only (teal). No purple, no blue gradients.

━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPOGRAPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━
Display/heading font: Instrument Serif (Google Fonts, italic variant for emphasis)
UI/body font: General Sans (Fontshare, weights 400/500/600)

Scale:
  Page title: 1.7–2rem, Instrument Serif
  Section heading: 14–15px, General Sans 600
  Body text: 14–15px, General Sans 400
  Labels/meta: 11–12px, General Sans 500
  Badges/timestamps: 11px

━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━
Desktop (>1024px):
  - 56px sticky topbar (logo, search bar with ⌘K, upload button, theme toggle, avatar)
  - 220px left sidebar (collapsible to icon-only at 768–1024px)
  - Main content area with 28–32px padding

Sidebar items: icon + label + optional count badge
Active sidebar item: --primary-bg background, --primary text color
Sidebar sections separated by section labels (UPPERCASE, 11px, faint color) and dividers

Mobile (<768px):
  - Sidebar hidden
  - 5-item bottom navigation bar (Home, Papers, Insights, Reviews, Settings)
  - Floating Action Button (teal, bottom-right) for Upload Paper
  - Main content padding: 16–20px with 80px bottom padding

━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━
Paper card:
  - Surface background, 14px border-radius, 1px border, subtle box-shadow
  - Type badge (pill shape): Journal = green tint, Conference = teal tint, Thesis = orange tint
  - Title in General Sans 600, 13px, 2-line clamp
  - Author + year in faint muted text
  - Tags as pill chips with surface-offset background
  - Footer: insight count (faint) + "Open →" ghost link

Upload zone:
  - Dashed border with teal color at 35% opacity
  - Teal tint background (4–7%)
  - Center-aligned icon + title + subtitle text
  - On hover: border becomes solid teal, background slightly stronger tint

AI Insight items:
  - Small teal dot left indicator
  - Text with bold keyword prefix (e.g., "Consistent finding:", "Methodological gap:")
  - Items separated by 1px dividers

Stat cards:
  - 4-column grid on desktop, 2-column on mobile
  - Label (uppercase, 11px), large number (tabular-nums), small change indicator

Buttons:
  - Primary: teal background, white text, 8px radius
  - Secondary: surface-offset bg, 1px border, text color
  - Ghost: transparent, muted text, hover = primary-bg
  - All buttons: General Sans 600, 13–14px

━━━━━━━━━━━━━━━━━━━━━━━━━━
LANDING PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Sticky navbar: logo (Instrument Serif + teal dot), nav links, CTA buttons
- Hero: 2-column grid (left = copy, right = preview card mockup)
  - Badge: teal pill "✦ AI-Powered Research"
  - H1 in Instrument Serif with italic teal emphasis word
  - Body text max 44ch
  - CTA: Primary "Start for Free →" + Secondary "See Demo"
  - Note: "No credit card required · Free for students" (faint, 12px)
- Feature grid: asymmetric (2fr + 1fr + 1fr), featured card spans 2 rows with dark/inverted background
- No purple gradients, no icon circles with colored backgrounds

━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO AVOID
━━━━━━━━━━━━━━━━━━━━━━━━━━
- No colored gradient hero backgrounds
- No icons inside colored circles for feature sections
- No centered body text in cards
- No more than 1 accent color in the entire app
- No oversized headings (>2.5rem) inside the app shell
- No border-left colored strips on paper cards