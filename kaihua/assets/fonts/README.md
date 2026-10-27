# Display fonts

Locally hosted, 400-weight display subsets from Google Fonts:

- Cormorant Garamond, by Christian Thalmann / the Cormorant Project. Latin alphabet subset for the cover title and wordmark. Source: https://github.com/CatharsisFonts/Cormorant
- Noto Serif SC, by Adobe / Google. Chinese display subset for the cover and wordmark; other characters retain the existing system-font fallback. Source: https://github.com/google/fonts/tree/main/ofl/notoserifsc

The original SIL Open Font License notices are included alongside each font. The browser uses these local files with `font-display: swap`; it makes no Google Fonts requests. Body text keeps the existing sans-serif stack for reading. These are cover-only subsets, not a replacement for a complete Chinese body font.
