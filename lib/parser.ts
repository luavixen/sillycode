/**
 * Styling options for text formatting.
 */
export enum StyleKind {
  /** Bold text `[b]` - renders as `<strong>` */
  BOLD = 'b',
  /** Italic text `[i]` - renders as `<em>` */
  ITALIC = 'i',
  /** Underlined text `[u]` - renders as `<ins>` */
  UNDERLINE = 'u',
  /** Strikethrough text `[s]` - renders as `<del>` */
  STRIKETHROUGH = 's',
  /** Link `[url]` - renders as `<a href="...">` */
  LINK = 'url',
}

/**
 * Emoticon types supported by sillycode.
 */
export enum EmoteKind {
  /** Smiley face `[:)]` - renders as: ![](https://sillypost.net/static/emoticons/smile.png) */
  SMILE = 'smile',
  /** Sad face `[:(]` - renders as: ![](https://sillypost.net/static/emoticons/sad.png) */
  SAD = 'sad',
  /** Big smile `[:D]` - renders as: ![](https://sillypost.net/static/emoticons/colond.png) */
  COLON_D = 'colond',
  /** Colon-three face `[:3]` - renders as: ![](https://sillypost.net/static/emoticons/colonthree.png) */
  COLON_THREE = 'colonthree',
  /** Fearful face `[D:]` - renders as: ![](https://sillypost.net/static/emoticons/fearful.png) */
  FEARFUL = 'fearful',
  /** Sunglasses `[B)]` - renders as: ![](https://sillypost.net/static/emoticons/sunglasses.png) */
  SUNGLASSES = 'sunglasses',
  /** Crying face `[;(]` - renders as: ![](https://sillypost.net/static/emoticons/crying.png) */
  CRYING = 'crying',
  /** Winking face `[;)]` - renders as: ![](https://sillypost.net/static/emoticons/winking.png) */
  WINKING = 'winking',
}

/** RGB color value with 8-bit components, represented as a hex string like `"#ad77f1"`. */
export type Color = string;

/** Regular text content part. */
export type TextPart = {
  type: 'text';
  text: string;
};

/** Escape backslash character part. */
export type EscapePart = {
  type: 'escape';
};

/** Line break character part. */
export type NewlinePart = {
  type: 'newline';
};

/** Style formatting toggle, enable or disable, each effect is independent. */
export type StylePart = {
  type: 'style';
  style: StyleKind;
  enable: boolean;
};

/** Color formatting toggle, enable or disable, acts as a stack. */
export type ColorPart = { type: 'color' } & (
  { enable: true, color: Color } |
  { enable: false }
);

/** Emoticon image part. */
export type EmotePart = {
  type: 'emote';
  emote: EmoteKind;
};

/**
 * A single element of parsed sillycode markup.
 */
export type Part =
  | TextPart
  | EscapePart
  | NewlinePart
  | StylePart
  | ColorPart
  | EmotePart;


/** lookup table for style tags like [b] or [/i] */
var styleParts = Object.create(null) as Record<string, StylePart>;

function addStyle(text: string, kind: StyleKind) {
  styleParts[      text] = { type: 'style', style: kind, enable: true  };
  styleParts['/' + text] = { type: 'style', style: kind, enable: false };
}

addStyle('b', StyleKind.BOLD);
addStyle('i', StyleKind.ITALIC);
addStyle('u', StyleKind.UNDERLINE);
addStyle('s', StyleKind.STRIKETHROUGH);
addStyle('url', StyleKind.LINK);

/** lookup table for emote tags like [:)] or [:D] */
var emoteParts = Object.create(null) as Record<string, EmotePart>;

function addEmote(text: string, kind: EmoteKind) {
  emoteParts[text] = { type: 'emote', emote: kind };
}

addEmote(':)', EmoteKind.SMILE);
addEmote(':(', EmoteKind.SAD);
addEmote(':D', EmoteKind.COLON_D);
addEmote(':3', EmoteKind.COLON_THREE);
addEmote('D:', EmoteKind.FEARFUL);
addEmote('B)', EmoteKind.SUNGLASSES);
addEmote(';(', EmoteKind.CRYING);
addEmote(';)', EmoteKind.WINKING);

/**
 * Parses sillycode markup into a list of parts.
 *
 * @param input The sillycode markup string to parse
 * @returns An array of parsed parts
 */
export function parse(input: string): Part[] {
  var parts: Part[] = [];

  // emits a new part
  function emit(part: Part): void {
    parts.push(part);
  }

  var buffer = '';

  // flushes the buffer as a text part if it's not empty
  function flush(): void {
    if (buffer) {
      emit({ type: 'text', text: buffer });
      buffer = '';
    }
  }

  // parses a tag body into a part
  function parseTag(body: string): Part | null {
    if (!body) {
      return null;
    }

    // check for style:
    var style = styleParts[body];
    if (style) {
      return style;
    }

    // check for emote:
    var emote = emoteParts[body];
    if (emote) {
      return emote;
    }

    // check for color push:
    var color = /^color=(#[0-9a-fA-F]{6})$/.exec(body);
    if (color) {
      return { type: 'color', enable: true, color: color[1]! };
    }

    // check for color pop:
    if (body === '/color') {
      return { type: 'color', enable: false };
    }

    return null;
  }

  // attempts to parse a tag at the current position
  function attemptTag(): boolean {
    // find the last opening bracket
    var index = buffer.lastIndexOf('[');
    if (index < 0) {
      return false;
    }

    // detect escape
    var lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.type === 'escape' && index === 0) {
      return false;
    }

    // extract the tag body
    var body = buffer.slice(index + 1);

    // parse the tag
    var part = parseTag(body);

    // if we parsed a tag
    if (part) {
      // remove the tag from the buffer
      buffer = buffer.slice(0, index);
      // emit both the remaining buffer and the parsed part
      flush();
      emit(part);
      // success!
      return true;
    }

    // we did not parse a tag :<
    return false;
  }

  // is the next character escaped?
  var escape = false;

  // main parsing loop
  for (var i = 0; i < input.length; i++) {
    var char = input[i]!;

    // if we are not escaping
    if (!escape) {
      // check for escape
      if (char === '\\') {
        escape = true;
        flush();
        emit({ type: 'escape' });
        continue;
      }
      // check for tag close
      if (char === ']') {
        if (attemptTag()) {
          continue;
        }
      }
    }

    // make sure to reset the escape flag
    escape = false;

    // check for newline
    if (char === '\n') {
      flush();
      emit({ type: 'newline' });
      continue;
    }

    // collect normal characters in the buffer
    buffer += char;
  }

  // flush any remaining text
  flush();

  // we are done :3
  return parts;
}


/** counts the number of unicode scalars in a string */
function countUnicodeScalars(string: string): number {
  var count = 0;

  for (var i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) {
      i++;
    }
    count++;
  }

  return count;
}


/**
 * Calculates the display length of parsed parts.
 *
 * @param parts The array of parsed parts to measure
 * @returns The display length as a number of visible characters
 */
export function length(parts: Part[]): number {
  var length = 0;

  parts.forEach(function (part) {
    if (part.type === 'text') {
      length += countUnicodeScalars(part.text);
    } else if (part.type === 'newline' || part.type === 'emote') {
      length += 1;
    }
  });

  return length;
}
