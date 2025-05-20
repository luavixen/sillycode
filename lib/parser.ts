

/** the kind of styling to apply */
export enum StyleKind {
  BOLD = 'b',
  ITALIC = 'i',
  UNDERLINE = 'u',
  STRIKETHROUGH = 's',
  LINK = 'url',
}

/** the kind of emoticon to render */
export enum EmoteKind {
  // values are filenames in the /static/emoticons directory,
  // without the .png extension
  SMILE = 'smile',
  SAD = 'sad',
  COLON_D = 'colond',
  COLON_THREE = 'colonthree',
  FEARFUL = 'fearful',
  SUNGLASSES = 'sunglasses',
  CRYING = 'crying',
  WINKING = 'winking',
}

/** represents a hex color value like "#ad77f1" */
export type ColorValue = string;

/** regular text content part */
export type TextPart = {
  type: 'text';
  text: string;
};

/** escape character part */
export type EscapePart = {
  type: 'escape';
};

/** newline character part */
export type NewlinePart = {
  type: 'newline';
};

/** style formatting command (enable or disable, each effect is independent) */
export type StylePart = {
  type: 'style';
  style: StyleKind;
  enable: boolean;
};

/** color formatting command (enable or disable, acts as a stack) */
export type ColorPart = { type: 'color' } & (
  { enable: true, color: ColorValue } |
  { enable: false }
);

/** emoticon image part */
export type EmotePart = {
  type: 'emote';
  emote: EmoteKind;
};

/** represents one part of some sillycode markup */
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
 * parses sillycode markup into a list of {@link Part}s
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
  function attemptTag(closeIndex: number): boolean {
    // find the last opening bracket
    var openIndex = buffer.lastIndexOf('[');
    if (openIndex < 0) {
      return false;
    }

    // detect escape
    var lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.type === 'escape' && openIndex === 0) {
      return false;
    }

    // extract the tag body
    var body = buffer.slice(openIndex + 1, closeIndex);

    // parse the tag
    var part = parseTag(body);
    if (part) {
      // remove the tag from the buffer
      buffer = buffer.slice(0, openIndex);
      // emit both the remaining buffer and the parsed part
      flush();
      emit(part);
      // we parsed a tag
      return true;
    }

    // we did not parse a tag
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
        if (attemptTag(i)) {
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


/** calculates the length of a list of parts */
export function length(parts: Part[]): number {
  var length = 0;

  parts.forEach(function (part) {
    if (part.type === 'text') {
      length += countUnicodeScalars(part.text);
    } else if (part.type === 'newline') {
      length += 1;
    } else if (part.type === 'emote') {
      length += 1;
    }
  });

  return length;
}
