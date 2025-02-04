import TurndownService from 'turndown';

const DEFAULT_CONFIG = {
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  preformattedCode: true,
} as const;

const DEFAULT_RULES = {
  figure: {
    filter: 'figure',
    replacement: (content: string, node: any): string => {
      const figure: any = node;
      const img = figure.querySelector('img');
      const figcaption = figure.querySelector('figcaption');

      if (!img) return content;

      const alt = img.getAttribute('alt') || '';
      const src = img.getAttribute('src') || '';
      const caption = figcaption ? figcaption.textContent?.trim() : '';

      return `![${alt}](${src})\n\n${caption}\n\n`;
    },
  },
  codeBlock: {
    filter: ['pre', 'code'],
    replacement: (content: string, node: any): string => {
      // pre 태그 안에 있는 code 태그는 건너뛰기
      if (node.nodeName === 'CODE' && node.parentNode.nodeName === 'PRE') {
        return '';
      }

      // pre 태그 처리
      if (node.nodeName === 'PRE') {
        const code = node.querySelector('code');
        const language = code?.getAttribute('class')?.replace(/^language-/, '') || '';
        const codeContent = code?.textContent || node.textContent || '';

        // 코드 내용의 각 줄의 공백을 보존
        const preservedContent = codeContent
          .split('\n')
          .map((line) => line.trimEnd()) // 줄 끝의 공백만 제거
          .join('\n')
          .trim();

        return `\`\`\`${language}\n${preservedContent}\n\`\`\`\n\n`;
      }

      // 인라인 코드 처리
      return `\`${content}\``;
    },
  },
};

interface MarkdownOptions {
  config?: typeof DEFAULT_CONFIG;
  rules?: typeof DEFAULT_RULES;
}

const markdown = (html: string, options: MarkdownOptions = {}) => {
  const { config = DEFAULT_CONFIG, rules = DEFAULT_RULES } = options;

  const turndownService = new TurndownService(config);
  Object.entries(rules).forEach(([key, value]) => {
    turndownService.addRule(key, value);
  });
  return turndownService.turndown(html);
};

export { markdown };
