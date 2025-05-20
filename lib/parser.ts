

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
    if (buffer !== '') {
      emit({ type: 'text', text: buffer });
      buffer = '';
    }
  }

  // main parsing loop:

  var state: 'text' | 'escape' | 'tag' = 'text' as any;

  for (var i = 0; i < input.length; i++) {
    var char = input[i]!;

    // if this is normal text, including escape characters:
    if (state === 'text' || state === 'escape') {
      // if this is not an escape:
      if (state === 'text') {
        // check for tag:
        if (char === '[') {
          flush();
          state = 'tag';
          continue;
        }
        // check for escape:
        if (char === '\\') {
          flush();
          emit({ type: 'escape' });
          state = 'escape';
          continue;
        }
      } else {
        // this character was escaped,
        // switch back to text state after handling it normally:
        state = 'text';
      }

      // check for newline:
      // we always do this, even if we're in an escape state
      if (char === '\n') {
        flush();
        emit({ type: 'newline' });
        continue;
      }

      // handle character normally:
      buffer += char;
      continue;
    }

    // if this is a tag:
    if (char === ']') {
      // reset state
      state = 'text';

      // check for style:
      var style = styleParts[buffer];
      if (style) {
        buffer = '';
        emit(style);
        continue;
      }

      // check for emote:
      var emote = emoteParts[buffer];
      if (emote) {
        buffer = '';
        emit(emote);
        continue;
      }

      // check for color push:
      var color = /^color=(#[0-9a-fA-F]{6})$/.exec(buffer);
      if (color) {
        buffer = '';
        emit({ type: 'color', enable: true, color: color[1]! });
        continue;
      }

      // check for color pop:
      if (buffer === '/color') {
        buffer = '';
        emit({ type: 'color', enable: false });
        continue;
      }

      // not a valid tag, so we'll just render it as text
      buffer = '[' + buffer + ']';
    } else {
      // collect the body of the tag in the buffer
      buffer += char;
    }
  }

  // flush any remaining text:

  if (state === 'tag') {
    buffer = '[' + buffer;
  }

  flush();

  // we are done :3
  return parts;
}
