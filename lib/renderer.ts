import { EmoteKind, StyleKind } from './parser.ts';
import type { ColorPart, Color, EmotePart, EscapePart, NewlinePart, Part, StylePart, TextPart } from './parser.ts';

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

/** escapes a URL by adding the http(s) protocol if it's not there */
function escapeHref(href: string): string {
  // trim the input
  href = href.trim();

  // add the https protocol if it's not there (allows http too!)
  if (!href.startsWith('http://') && !href.startsWith('https://')) {
    href = 'https://' + href;
  }

  return href;
}

/** represents a reference to the `href` field of a link in the outputted HTML */
interface Link {
  href: string;
  replacer: string;
}

/** creates a new link with the given id */
function createLink(id: number): Link {
  return {
    href: '',
    replacer: '§§HREF' + id + '§§'
  };
}

/** represents a HTML element in the element stack */
type Element =
  | { name: 'strong' }
  | { name: 'em' }
  | { name: 'ins' }
  | { name: 'del' }
  | { name: 'span', color: Color }
  | { name: 'a', link: Link };

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
 * Renders parsed sillycode parts as HTML.
 *
 * Set `isEditor` to `true` to include visible markup tags for editing purposes.
 *
 * @param parts The array of parsed parts to render
 * @param isEditor Whether the output is for an editor or not
 * @returns The rendered HTML as a string
 */
export function render(parts: Part[], isEditor?: boolean): string {
  if (isEditor !== true) isEditor = false;

  // html output
  var html = '';

  // element stack
  var elements: Element[] = [];

  // counter for link ids
  var linkCounter = 0;
  // clist of all links
  var linkList: Link[] = [];

  // opens an element
  function open(element: Element): void {
    if (element.name === 'span') {
      html += '<span style="color: ' + element.color + '">';
    } else if (element.name === 'a') {
      html += '<a href="' + element.link.replacer + '">';
    } else {
      html += '<' + element.name + '>';
    }
  }

  // closes an element
  function close(element: Element): void {
    html += '</' + element.name + '>';
  }

  // opens all elements in the element stack
  function openAll(elements: Element[]): void {
    elements.forEach(open);
  }

  // closes all elements in the element stack in reverse order
  function closeAll(elements: Element[]): void {
    elements.slice().reverse().forEach(close);
  }

  // pushes an element onto the element stack
  function push(element: Element): void {
    open(element);
    elements.push(element);
  }

  // checks if the element stack contains an element
  function contains(name: Element['name']): boolean {
    for (var i = 0; i < elements.length; i++) {
      if (elements[i]!.name === name) {
        return true;
      }
    }
    return false;
  }

  // removes an element from the element stack
  function remove(name: Element['name']): boolean {
    for (var i = elements.length - 1; i >= 0; i--) {
      if (elements[i]!.name === name) {
        // remove the element from the stack
        var removed = elements.splice(i, 1)[0]!;
        // select all preserved elements
        var preserved = elements.slice(i);

        // close all preserved elements, in reverse order
        closeAll(preserved);

        // close the removed element
        close(removed);

        // re-open all preserved elements
        openAll(preserved);

        return true;
      }
    }
    return false;
  }

  // applies a specific style element,
  // possibly pushing/popping from the element stack
  function apply(name: 'strong' | 'em' | 'ins' | 'del', enable: boolean): void {
    if (enable) {
      if (!contains(name)) {
        push({ name: name });
      }
    } else {
      remove(name);
    }
  }

  // creates a new link and adds it to the link list,
  // then pushes it to the element stack
  function pushLink(): void {
    var link = createLink(linkCounter);
    linkCounter += 1;
    linkList.push(link);
    push({ name: 'a', link: link });
  }

  // appends to all links in the element stack
  function appendLink(text: string): void {
    elements.forEach(function (element) {
      if (element.name === 'a') {
        element.link.href += text;
      }
    });
  }

  // writes "meta" text, usually tags like "[url]" or "[b]",
  // wrapped in a span, to the renderer's buffer, if isEditor is true
  function meta(text: string): void {
    if (isEditor) {
      html += '<span class="sillycode-meta">' + text + '</span>';
    }
  }

  // handles text parts
  function onText(part: TextPart): void {
    // escape the text for HTML
    var text = escapeHtml(part.text);

    // append the text to the HTML output
    html += text;

    // update the link hrefs
    appendLink(text)
  }

  // handles escape parts
  function onEscape(part: EscapePart): void {
    // emit the backslash if isEditor is true
    // we don't need to do anything else! it's handled by the parser
    meta('\\');
  }

  // handles newline parts
  function onNewline(part: NewlinePart): void {
    // close all elements used for styling to get back to the root of the tree
    closeAll(elements);

    // close and open a new div to start a new line
    html += '</div><div>';

    // re-open all elements
    openAll(elements);
  }

  // handles style parts
  function onStyle(part: StylePart): void {
    // links are a special case
    if (part.style === StyleKind.LINK) {
      if (part.enable) {
        meta('[url]');
        pushLink();
      } else {
        remove('a');
        meta('[/url]');
      }
    // all other styles are handled by apply
    } else {
      if (part.enable) {
        meta('[' + part.style + ']');
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
        meta('[/' + part.style + ']');
      }
    }
  }

  // handles color parts
  function onColor(part: ColorPart): void {
    if (part.enable) {
      meta('[color=' + part.color + ']');
      push({ name: 'span', color: part.color });
    } else {
      remove('span');
      meta('[/color]');
    }
  }

  // handles emote parts
  function onEmote(part: EmotePart): void {
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

  // close all elements
  closeAll(elements);

  // close the output
  html += '</div>';

  // replace all link references with the actual hrefs
  linkList.forEach(function (link) {
    html = html.replace(new RegExp(link.replacer, 'g'), escapeHref(link.href));
  });

  // postprocess the html to add <br> tags where needed
  html = html
    .replace(/<div> /g, '<div>&nbsp;')
    .replace(/ <\/div>/g, ' <br></div>')
    .replace(/<div><\/div>/g, '<div><br></div>');

  // we are done :3
  return html;
}
