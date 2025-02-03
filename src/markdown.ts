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
};


const markdown = (html: string, config: any = DEFAULT_CONFIG, rules: any = DEFAULT_RULES) => {
  const turndownService = new TurndownService(config);
  Object.entries(rules).forEach(([key, value]) => {
    turndownService.addRule(key, value);
  });
  return turndownService.parse(html);
};

export { markdown };
