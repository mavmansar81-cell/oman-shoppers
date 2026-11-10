# Design brief

Oman Shoppers — a price comparison for electronics in Oman. One exact model per
product, five Omani retailers under it, cheapest first. This is a published sample
for review: every figure is a placeholder. LuluOman and GadgetsOman are the two
rows added for review, and both are labelled "Sample row" wherever they appear
(`sample: true` on the retailer). Their prices must not be presented as those
shops' real prices until live data and any permission the shops need are in place.

## Palette and type

Every value lives in `src/theme.css`. Nothing hardcodes a colour, a font stack,
a radius or a shadow.

- **Ground** — warm paper (`--background`), cards a shade lighter (`--card`),
  a sand secondary for rows and chips (`--secondary`).
- **Ink** — a deep ink blue (`--foreground`, `--primary`). The top bar and the
  footer are the ink as a ground.
- **Gulf teal** (`--teal`, `--teal-deep`, `--teal-soft`) — owns the product
  page's header band, the search button, the tile surfaces and the mark. It is
  the brand colour, used as a surface, not as a sprinkle.
- **Saffron** (`--saffron`, `--saffron-soft`, `--saffron-ink`, `--saffron-text`) —
  the one accent, present in exactly two places per page: the development
  notice's strip, and once per product table on the cheapest retailer (row tint
  `--saffron-soft`, chip `--saffron`, figure `--saffron-text`, which is the hue
  darkened to clear 4.5:1 on tinted paper). It appears nowhere else. The lowest
  price in the product header band is the same fact but a different ground, so
  it is set in `--teal-on-band`, not saffron.
- **Teal as text** — `--teal-deep` is for the drawing inside a soft teal tile;
  `--teal-text` is the token for links and figures on paper, darkened so every
  teal label clears 4.5:1. The band's ground is `--teal-band`.

Prices are set in tabular figures (`font-mono tabular-nums`) so OMR columns
line up. Every price reads three decimals then OMR — `189.900 OMR`.

One scheme, deliberately. No `prefers-color-scheme` override.

## Faces

Bricolage Grotesque (headings — enough character to carry a name without
ornament) over IBM Plex Sans (body, labels, figures — clear numerals, good
tabular figures for price columns). Both load in `src/fonts.css` with
`display=swap`. Two families, no third.

## Brand mark

`src/components/Brand.tsx`: a price-tag shape in Gulf teal beside "Oman
Shoppers" in the heading face. The tag is two paths in an inline SVG, and the
favicon is the same tag on paper. Icons are one weight throughout:
**stroke-width 1.5**, rounded caps, in Lucide.

## Imagery

No photographs. The sample version does not claim real stock or real stores, so
every product is a line drawing in the site's own two colours — ink outline
with the highlighted edge in teal (`src/components/DeviceDrawing.tsx`), one per
device type: phone, laptop, gamepad, headphones. The product page's header is a
teal band holding the same drawing.

## Shell

A top bar on every route — the mark left, a search field right, which folds to
a single search icon at 360 — and a footer. No other navigation, no About or
Contact page. Routes: `/` and `/product/:id`, plus the 404.

## Development notice

`src/components/DevNotice.tsx` sits directly under the top bar, full width, on
every route — before any product or price. Saffron-soft ground with `--saffron-ink`
text and a saffron hairline: a status line, not an alert. It says the site is
under development, the prices are samples, and live prices and saved lists are
not available yet. It dismisses to a single-line strip with a "Show notice"
control, and the footer repeats the same fact in one line. At 360 the text wraps
to two lines rather than truncating.

## Home ground

The home page's search and category area sits on a layered ground built only
from tokens: a radial glow from `--teal-soft` fading into paper, a second teal
glow at the top right, and a fine `--foreground` dot texture at 9% masked out
downward. The product grid below is plain `--background` with `--card` tiles so
the prices stay the clearest thing on the page.
## Voice

Real copy, specific to the business: the shops are Omani retailers, the prices
are in OMR, and the page says plainly that the figures are samples with no live
prices, accounts or saved lists yet.
