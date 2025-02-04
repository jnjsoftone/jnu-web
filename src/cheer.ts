import * as cheerio from 'cheerio';

// * settings = [{'key': '', 'selector': '', 'target': ''}]
interface CheerSetting {
  key: string;
  selector: string;
  target?: string;
  callback?: (value: any) => any;
}

// *
const querySelectorAll = ($root: any, selector: string) => {
  return $root instanceof Function ? $root(selector) : $root.find(selector);
};

// *
const querySelector = ($root: any, selector: string) => {
  return $root instanceof Function ? $root(selector).eq(0) : $root.find(selector).eq(0);
};

// *
const _getValue = ($element: any, target: string) => {
  target ??= 'text';
  let rst;

  switch (target.toLowerCase()) {
    case 'text':
      rst = $element.text().trim();
      break;
    case 'texts':
      let contents = $element.contents();
      let texts: any[] = [];
      // console.log(`###contents.length: ${contents.length}`);
      for (let i = 0; i < contents.length; i++) {
        let _text: any = contents.eq(i).text().trim();
        // console.log(`###_text: |${_text}|`)
        if (_text.length > 0) {
          // console.log(`###_text: |${_text}|`)
          texts.push(_text);
        }
      }
      rst = texts;
      break;
    case 'innerhtml':
      rst = $element.html().trim();
      break;
    default:
      rst = $element.attr(target);
  }

  return rst;
};

// *
const getValue = ($root: any, selector: string, target?: string) => {
  target ??= 'text';
  let $element = querySelector($root, selector);
  return !$element ? '' : _getValue($element, target);
};

// *
const getValues = ($root: any, selector: string, target?: string) => {
  target ??= 'text';
  let $elements = querySelectorAll($root, selector);
  if (!$elements) return [];

  let values: any[] = [];
  for (let i = 0; i < $elements.length; i++) {
    let $element = $elements.eq(i);
    let value = _getValue($element, target);
    if (value) values.push(value);
  }
  return values;
};

// *
const getHtml = ($: any, selector?: string) => {
  if (!selector) {
    return $.html(); // selector가 없는 경우 전체 HTML 반환
  }
  return $.html(querySelector($, selector)); // selector가 있는 경우 해당 요소의 HTML 반환
};

// *
const getValueFromStr = (str: string, selector: string, target?: string) => {
  return getValue(cheerio.load(str), selector, target);
};

// *
const getValuesFromStr = (str: string, selector: string, target?: string) => {
  return getValues(cheerio.load(str), selector, target);
};

const dictFromRoot = ($root: any, settings: CheerSetting[] = []) => {
  let dict: any = {};
  for (let setting of settings) {
    if (!setting.selector) {
      continue;
    }
    let value = getValue($root, setting.selector, setting.target);
    dict[setting.key] = setting.callback ? setting.callback(value) : value;
  }
  return dict;
};

// * settings = [{'key': '', 'selector': '', 'target': ''}, ...]
const dictsFromRoots = ($roots: any[], settings: CheerSetting[] = [], required: string[] = []) => {
  let dicts: any[] = [];
  for (let i = 0; i < $roots.length; i++) {
    let $root = $roots[i];
    // let $root = $roots.eq(i);
    let dict = dictFromRoot($root, settings);
    if (!dict) continue;
    let notPush = false;
    for (let key of required) {
      // 필수항목 값 확인
      if (!dict[key]) {
        notPush = true;
        break;
      }
    }
    if (!notPush) dicts.push(dict);
  }
  return dicts;
};

// *
const removeElement = ($root: any, selector: string) => {
  if ($root instanceof Function) {
    $root(selector).eq(0).remove();
  } else {
    $root.find(selector).eq(0).remove();
  }
};

// *
const removeElements = ($root: any, selector: string) => {
  if ($root instanceof Function) {
    $root(selector).remove();
  } else {
    $root.find(selector).remove();
  }
};

// *
const addElement = ($root: any, source: string, target: string, location: 'before' | 'after' = 'after') => {
  if ($root instanceof Function) {
    switch (location) {
      case 'before':
        $root(target).before(source);
        break;
      case 'after':
        $root(target).after(source);
        break;
    }
  } else {
    switch (location) {
      case 'before':
        $root.find(target).before(source);
        break;
      case 'after':
        $root.find(target).after(source);
        break;
    }
  }
};

// *
const retag = ($root: any, selector: string, newTag: string) => {
  if ($root instanceof Function) {
    $root(selector).each((_, element) => {
      const $element = $root(element);
      const attrs = element.attribs;
      const content = $element.html();
      const $newElement = $root(`<${newTag}>`).attr(attrs).html(content);
      $element.replaceWith($newElement);
    });
  } else {
    $root.find(selector).each((_, element) => {
      const $element = $root(element);
      const attrs = element.attribs;
      const content = $element.html();
      const $newElement = $root(`<${newTag}>`).attr(attrs).html(content);
      $element.replaceWith($newElement);
    });
  }
};

// & CLASS AREA
// ** class
class Cheer {
  private source: string;
  private $: cheerio.CheerioAPI;

  constructor(source: string) {
    this.source = source;
    this.$ = cheerio.load(source) as cheerio.CheerioAPI;
  }

  root() {
    return this.$;
  }

  value(selector: string, target?: string) {
    return getValue(this.$, selector, target);
  }

  values(selector: string, target?: string) {
    return getValues(this.$, selector, target);
  }

  html(selector: string) {
    return getHtml(this.$, selector);
  }

  json(settings: CheerSetting[] = []) {
    return dictFromRoot(this.$, settings);
  }

  jsons($roots: any[], settings: CheerSetting[] = [], required: string[] = []) {
    return dictsFromRoots($roots, settings, required);
  }

  remove(selector: string) {
    removeElement(this.$, selector);
  }

  del(selector: string) {
    removeElements(this.$, selector);
  }

  add(source: string, target: string, location: 'before' | 'after' = 'after') {
    addElement(this.$, source, target, location);
  }

  retag(selector: string, newTag: string) {
    retag(this.$, selector, newTag);
  }
}

// & EXPORT
export { Cheer, retag };

// // & TEST
// const str = `
// <html>
// <div>
// <div>
// div1
// </div>
// </div>
// </html>
// `

// const ci = new Cheer(str);
// console.log(ci.value('div > div'));
