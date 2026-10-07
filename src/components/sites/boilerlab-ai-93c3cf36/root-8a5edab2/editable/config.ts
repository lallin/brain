/**
 * Master switch for the in-page editing tools: click-to-edit text, the
 * drag / resize / font-size handles, the color palette, and the
 * /api/site-edits writes behind them. Off while the site is shared outside
 * (a public tunnel link), so visitors can't change the copy. Saved edits in
 * data/site-edits.json still render either way. Set to true to edit again.
 */
export const SITE_EDITING_ENABLED = false;
