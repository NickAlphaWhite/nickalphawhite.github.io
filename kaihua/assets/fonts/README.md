# Display fonts

Active typography is defined in `../site-shell.css`:

- **Marcellus**: locally hosted regular Latin font, used for the English title, wordmark and navigation. Source: https://fonts.google.com/specimen/Marcellus
- **LXGW WenKai**: locally hosted WOFF2 subset (919 CJK characters from the current UI and narratives), used for Chinese titles and navigation. Source: https://github.com/lxgw/LxgwWenKai

Both fonts retain their original SIL Open Font License notices. Long-form body text keeps the system sans-serif stack; unsupported future characters fall back to system fonts. The browser makes no font-platform requests. Regenerate the WenKai subset when new title characters are added.

The following earlier cover assets are retained for history and are no longer requested by the page:

Locally hosted, 400-weight display subsets from Google Fonts:

- Cormorant Garamond, by Christian Thalmann / the Cormorant Project. Latin alphabet subset for the cover title and wordmark. Source: https://github.com/CatharsisFonts/Cormorant
- Noto Serif SC, by Adobe / Google. Chinese display subset for the cover and wordmark; other characters retain the existing system-font fallback. Source: https://github.com/google/fonts/tree/main/ofl/notoserifsc

The original SIL Open Font License notices are included alongside each font. The browser uses these local files with `font-display: swap`; it makes no Google Fonts requests. Body text keeps the existing sans-serif stack for reading. These are cover-only subsets, not a replacement for a complete Chinese body font.
