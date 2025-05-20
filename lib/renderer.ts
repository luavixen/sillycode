import { EmoteKind, StyleKind } from './parser.ts';
import type { ColorPart, ColorValue, EmotePart, EscapePart, NewlinePart, Part, StylePart, TextPart } from './parser.ts';

var escapeHtmlRegex = /[&<>"']/g;

var escapeHtmlCharacters: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHtmlCharacter(char: string): string {
  return escapeHtmlCharacters[char] || char;
}

/** escapes text so it can be safely used in HTML */
function escapeHtml(text: string): string {
  return text.replace(escapeHtmlRegex, escapeHtmlCharacter);
}

/** represents a reference to the `href` field of a link in the outputted HTML */
interface LinkReference {
  replacer: string;
  href: string;
}

function createLinkReference(id: number): LinkReference {
  return {
    replacer: '§§HREF' + id + '§§',
    href: ''
  };
}

/** the tag name of a HTML element in the element stack */
type ElementName = 'strong' | 'em' | 'ins' | 'del' | 'span' | 'a';

/** the tag name and associated data of a HTML element in the element stack */
type ElementData =
  | { element: Exclude<ElementName, 'span' | 'a'> }
  | { element: 'span', color: ColorValue }
  | { element: 'a', link: LinkReference };

/** lookup table for emote tag bodies eg ":)" keyed by emote kind eg "smile" */
var emoteKindToTag = Object.create(null) as Record<EmoteKind, string>;

emoteKindToTag[EmoteKind.SMILE      ] = ':)';
emoteKindToTag[EmoteKind.SAD        ] = ':(';
emoteKindToTag[EmoteKind.COLON_D    ] = ':D';
emoteKindToTag[EmoteKind.COLON_THREE] = ':3';
emoteKindToTag[EmoteKind.FEARFUL    ] = 'D:';
emoteKindToTag[EmoteKind.SUNGLASSES ] = 'B)';
emoteKindToTag[EmoteKind.CRYING     ] = ';(';
emoteKindToTag[EmoteKind.WINKING    ] = ';)';


/**
 * renders a list of {@link Part}s as HTML
 * @param parts - the list of parts to render
 * @param isEditor - whether the output is for an editor
 * @returns rendered HTML as a string
 */
export function render(parts: Part[], isEditor?: boolean): string {
  if (isEditor !== true) isEditor = false;

  // html output
  var html = '';

  // current element stack
  var elementStack: ElementName[] = [];

  // color stack, matching with the element stack
  var colorStack: ColorValue[] = [];

  // current link counter
  var linkCounter = 0;
  // contains all links in the order they were added
  var linkList: LinkReference[] = [];
  // contains current stack of links, matching with the element stack
  var linkStack: LinkReference[] = [];

  // pushes a style element onto the element stack
  function pushStyle(element: ElementName): void {
    html += '<' + element + '>';

    elementStack.push(element);
  }

  // pushes a color element onto the element stack and color stack
  function pushColor(color: ColorValue): void {
    html += '<span style="color: ' + color + '">';

    colorStack.push(color);
    elementStack.push('span');
  }

  // pushes a new link element onto the element stack,
  // while also tracking it in the link list and link stack
  function pushLink(): void {
    var link = createLinkReference(linkCounter++);

    html += '<a href="' + link.replacer + '">';

    linkList.push(link);
    linkStack.push(link);
    elementStack.push('a');
  }

  // pushes an element (from ElementData) onto the element stack
  function push(data: ElementData): void {
    if (data.element === 'span') {
      pushColor(data.color);
    } else if (data.element === 'a') {
      pushLink();
    } else {
      pushStyle(data.element);
    }
  }

  // pops an element from the element stack
  function pop(): ElementData | null {
    var element = elementStack.pop();
    if (element == null) return null;

    html += '</' + element + '>';

    if (element === 'span') {
      return { element: 'span', color: colorStack.pop()! };
    }
    if (element === 'a') {
      return { element: 'a', link: linkStack.pop()! };
    }

    return { element: element };
  }

  // pushes a list of elements (from ElementData) onto the element stack
  function pushAll(elements: ElementData[]): void {
    for (var i = 0; i < elements.length; i++) {
      push(elements[i]!);
    }
  }

  // pops all elements from the element stack
  function popAll(): ElementData[] {
    var elements: ElementData[] = [];

    for (;;) {
      var data = pop();
      if (data == null) break;

      elements.push(data);
    }

    return elements;
  }

  // checks if the element stack contains an element
  function contains(element: ElementName): boolean {
    for (var i = 0; i < elementStack.length; i++) {
      if (elementStack[i] === element) {
        return true;
      }
    }
    return false;
  }

  // removes an element from the element stack
  function remove(element: ElementName): boolean {
    if (!contains(element)) {
      return false;
    }

    var elements: ElementData[] = [];

    for (;;) {
      var data = pop();
      if (data == null) break;

      if (data.element === element) {
        break;
      }

      elements.push(data);
    }

    pushAll(elements);

    return true;
  }

  // used to emit markup like [b], [/url], [:3], or the first backslash of an escape
  // only works if isEditor is true
  function markup(text: string): void {
    if (isEditor) {
      html += '<span class="sillycode-markup">' + text + '</span>';
    }
  }

  // applies a specific style element,
  // possibly pushing/popping from the element stack
  function apply(element: ElementName, enable: boolean) {
    if (enable) {
      if (!contains(element)) {
        pushStyle(element);
      }
    } else {
      remove(element);
    }
  }

  // handles text parts
  function onText(part: TextPart) {
    // escape the text for HTML
    var text = escapeHtml(part.text);

    // append the text to the HTML output
    html += text;

    // update the link hrefs
    linkStack.forEach(function (link) {
      link.href += text;
    });
  }

  // handles escape parts
  function onEscape(part: EscapePart) {
    // emit the backslash if isEditor is true
    // we don't need to do anything else! it's handled by the parser
    markup('\\');
  }

  // handles newline parts
  function onNewline(part: NewlinePart) {
    // pop all elements from the element stack to get to the root element
    var elements = popAll();

    // close and open a new div to start a new line
    html += '</div><div>';

    // push all elements back onto the element stack
    pushAll(elements);
  }

  // handles style parts
  function onStyle(part: StylePart) {
    // links are a special case
    if (part.style === StyleKind.LINK) {
      if (part.enable) {
        markup('[url]');
        pushLink();
      } else {
        remove('a');
        markup('[/url]');
      }
    // all other styles are handled by apply
    } else {
      if (part.enable) {
        markup('[' + part.style + ']');
      }

      if (part.style === StyleKind.BOLD) {
        apply('strong', part.enable);
      } else if (part.style === StyleKind.ITALIC) {
        apply('em', part.enable);
      } else if (part.style === StyleKind.UNDERLINE) {
        apply('ins', part.enable);
      } else if (part.style === StyleKind.STRIKETHROUGH) {
        apply('del', part.enable);
      }

      if (!part.enable) {
        markup('[/' + part.style + ']');
      }
    }
  }

  // handles color parts
  function onColor(part: ColorPart) {
    if (part.enable) {
      markup('[color=' + part.color + ']');
      pushColor(part.color);
    } else {
      remove('span');
      markup('[/color]');
    }
  }

  // handles emote parts
  function onEmote(part: EmotePart) {
    if (isEditor) {
      html += '<span class="sillycode-emote" style="background-image: url(/static/emoticons/' + part.emote + '.png)">[' + emoteKindToTag[part.emote] + ']</span>';
    } else {
      html += '<img class="sillycode-emote" src="/static/emoticons/' + part.emote + '.png" alt="' + part.emote + '">';
    }
  }

  // start the output
  html += '<div>';

  // render the parts
  parts.forEach(function (part) {
    switch (part.type) {
      case 'text': onText(part); break;
      case 'escape': onEscape(part); break;
      case 'newline': onNewline(part); break;
      case 'style': onStyle(part); break;
      case 'color': onColor(part); break;
      case 'emote': onEmote(part); break;
    }
  });

  // pop all elements from the element stack to close them
  popAll();

  // close the output
  html += '</div>';

  // replace all link references with the actual hrefs
  linkList.forEach(function (link) {
    html = html.replace(new RegExp(link.replacer, 'g'), link.href.trim());
  });

  // we are done :3
  return html;
}
