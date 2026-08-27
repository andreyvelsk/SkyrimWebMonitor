import postcssHtml from 'postcss-html';

export default {
  extends: ['stylelint-config-standard-scss'],
  overrides: [
    {
      files: ['**/*.vue', '**/*.html'],
      customSyntax: postcssHtml
    }
  ],
  rules: {
    'no-empty-source': null,
    'at-rule-no-unknown': null,
    'keyframes-name-pattern': null,
    'selector-class-pattern': null,
    // The repo intentionally hand-writes `-webkit-` prefixes in source
    // (Autoprefixer is applied at build time in postcss.config.js).
    // stylelint's autofix for this rule would strip those prefixes and
    // collide with the unprefixed pair, corrupting the source — so disable.
    'property-no-vendor-prefix': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        // Vue scoped-style selectors are handled by vue-tsc, not stylelint.
        ignorePseudoClasses: ['deep', 'global', 'slotted']
      }
    ],
    'value-keyword-case': null,
    // `word-break: break-word` is used intentionally for CJK fallback.
    'declaration-property-value-keyword-no-deprecated': null,
    'scss/operator-no-newline-after': null,
    // stylelint's autofix for inline custom properties in Vue template
    // `style="..."` attributes injects a blank line + column-0 offset into the
    // attribute value, corrupting the template; disable it.
    'custom-property-empty-line-before': null,
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'layer', 'apply']
      }
    ]
  }
};
