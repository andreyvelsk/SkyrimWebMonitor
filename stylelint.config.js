import postcssHtml from 'postcss-html';

export default {
    extends: ['stylelint-config-standard-scss', 'stylelint-config-html'],
    customSyntax: postcssHtml,
    rules: {
        'no-empty-source': null,
        'at-rule-no-unknown': null,
        'keyframes-name-pattern': null,
        'selector-class-pattern': null,
        'scss/at-rule-no-unknown': [
            true,
            {
                ignoreAtRules: ['tailwind', 'layer', 'apply']
            }
        ]
    }
};
