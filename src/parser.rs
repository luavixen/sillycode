use std::fmt;
use strum::IntoEnumIterator;
use strum_macros::EnumIter;

/// the kind of styling to apply
#[derive(EnumIter, Debug, Clone, Copy, PartialEq)]
pub enum StyleKind {
  /// Bold text `[b]` - renders as `<strong>`
  Bold,
  /// Italic text `[i]` - renders as `<em>`
  Italic,
  /// Underlined text `[u]` - renders as `<ins>`
  Underline,
  /// Strikethrough text `[s]` - renders as `<del>`
  Strikethrough,
  /// Link `[url]` - renders as `<a href="...">`
  Link,
}

impl StyleKind {

  /// returns the tag for this style (eg "b" for bold),
  /// add a leading slash for closing tags
  pub const fn to_tag(&self) -> &str {
    match self {
      StyleKind::Bold => "b",
      StyleKind::Italic => "i",
      StyleKind::Underline => "u",
      StyleKind::Strikethrough => "s",
      StyleKind::Link => "url",
    }
  }

}

/// the kind of emoticon to render
#[derive(EnumIter, Debug, Clone, Copy, PartialEq)]
pub enum EmoteKind {
  /// Smiley face `[:)]` - renders as:
  /// ![](https://sillypost.net/static/emoticons/smile.png)
  Smile,
  /// Sad face `[:(`] - renders as:
  /// ![](https://sillypost.net/static/emoticons/sad.png)
  Sad,
  /// Big smile `[:D]` - renders as:
  /// ![](https://sillypost.net/static/emoticons/bigsmile.png)
  ColonD,
  /// Colon-three face `[:3]` - renders as:
  /// ![](https://sillypost.net/static/emoticons/colonthree.png)
  ColonThree,
  /// Fearful face `[D:]` - renders as:
  /// ![](https://sillypost.net/static/emoticons/fearful.png)
  Fearful,
  /// Sunglasses `[B)]` - renders as:
  /// ![](https://sillypost.net/static/emoticons/sunglasses.png)
  Sunglasses,
  /// Crying face `[;(`] - renders as:
  /// ![](https://sillypost.net/static/emoticons/crying.png)
  Crying,
  /// Winking face `[;)]` - renders as:
  /// ![](https://sillypost.net/static/emoticons/winking.png)
  Winking,
}

impl EmoteKind {

  /// returns the tag for this emote (eg ":)" for smile)
  pub const fn to_tag(&self) -> &str {
    match self {
      EmoteKind::Smile => ":)",
      EmoteKind::Sad => ":(",
      EmoteKind::ColonD => ":D",
      EmoteKind::ColonThree => ":3",
      EmoteKind::Fearful => "D:",
      EmoteKind::Sunglasses => "B)",
      EmoteKind::Crying => ";(",
      EmoteKind::Winking => ";)",
    }
  }

  /// returns the file name of this emote, no extension (eg "colonthree" for :3)
  pub const fn to_name(&self) -> &str {
    match self {
      EmoteKind::Smile => "smile",
      EmoteKind::Sad => "sad",
      EmoteKind::ColonD => "colond",
      EmoteKind::ColonThree => "colonthree",
      EmoteKind::Fearful => "fearful",
      EmoteKind::Sunglasses => "sunglasses",
      EmoteKind::Crying => "crying",
      EmoteKind::Winking => "winking",
    }
  }

}

/// represents a hex color value like "#ad77f1"
#[derive(Default, Debug, Clone, Copy, PartialEq)]
pub struct Color {
  /// Red component (0-255)
  pub r: u8,
  /// Green component (0-255)
  pub g: u8,
  /// Blue component (0-255)
  pub b: u8,
}

impl Color {

  /// creates a new color value
  pub const fn new(r: u8, g: u8, b: u8) -> Self {
    Self { r, g, b }
  }

}

impl fmt::Display for Color {

  /// formats the color as a hex string like "#ad77f1"
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "#{:02x}{:02x}{:02x}", self.r, self.g, self.b)
  }

}

/// represents one part of some sillycode markup,
/// can be converted back to markup with fmt::Display
#[derive(Debug, Clone, PartialEq)]
pub enum Part {
  /// a plain text part
  Text(String),
  /// an escape character part
  Escape,
  /// a newline character part
  Newline,
  /// a style formatting command (enable or disable, each effect is independent)
  Style(StyleKind, bool),
  /// a color formatting command (enable or disable, acts as a stack)
  Color(Color, bool),
  /// an emoticon image part
  Emote(EmoteKind),
}

impl Part {

  /// parses a style tag body like "b" or "/url"
  fn parse_style_tag(mut body: &str) -> Option<Self> {
    let mut enable = true;

    // check if the tag is closing
    if body.starts_with('/') {
      enable = false;
      body = &body[1..];
    }

    for style in StyleKind::iter() {
      if body == style.to_tag() {
        return Some(Self::Style(style, enable));
      }
    }

    None
  }

  /// parses an emote tag body like ":)"
  fn parse_emote_tag(body: &str) -> Option<Self> {
    for emote in EmoteKind::iter() {
      if body == emote.to_tag() {
        return Some(Self::Emote(emote));
      }
    }

    None
  }

  /// parses a color tag body like "color=#ad77f1"
  fn parse_color_tag(body: &str) -> Option<Self> {
    if body.len() == 13 && body.starts_with("color=#") {
      let r = u8::from_str_radix(&body[ 7.. 9], 16).ok()?;
      let g = u8::from_str_radix(&body[ 9..11], 16).ok()?;
      let b = u8::from_str_radix(&body[11..13], 16).ok()?;
      Some(Self::Color(Color::new(r, g, b), true))
    } else if body == "/color" {
      Some(Self::Color(Color::default(), false))
    } else {
      None
    }
  }

  /// parses any tag body
  fn parse_tag(body: &str) -> Option<Self> {
    if body.is_empty() || body.len() > 32 {
      return None;
    }

    Self::parse_style_tag(body)
      .or_else(|| Self::parse_emote_tag(body))
      .or_else(|| Self::parse_color_tag(body))
  }

}

impl fmt::Display for Part {

  /// formats the part as sillycode markup
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      Part::Text(text) => write!(f, "{text}"),
      Part::Escape => write!(f, "\\"),
      Part::Newline => write!(f, "\n"),
      Part::Style(style, enable) => {
        if *enable {
          write!(f, "[{}]", style.to_tag())
        } else {
          write!(f, "[/{}]", style.to_tag())
        }
      }
      Part::Color(color, enable) => {
        if *enable {
          write!(f, "[color={}]", color)
        } else {
          write!(f, "[/color]")
        }
      }
      Part::Emote(emote) => write!(f, "[{}]", emote.to_tag()),
    }
  }

}

/// parser for sillycode markup
#[derive(Default, Debug)]
struct Parser {
  /// output parts
  parts: Vec<Part>,
  /// buffer for text parts
  buffer: String,
  /// whether the previous character was an escape
  escape: bool,
}

impl Parser {

  /// creates a new parser
  fn new() -> Self {
    Self::default()
  }

  /// emits a new part
  fn emit(&mut self, part: Part) {
    self.parts.push(part);
  }

  /// flushes the buffer as a text part if it's not empty
  fn flush(&mut self) {
    if !self.buffer.is_empty() {
      self.emit(Part::Text(self.buffer.clone()));
      self.buffer.clear();
    }
  }

  /// attempts to parse a tag at the current position
  fn tag(&mut self) -> bool {
    // find the last opening bracket
    let index = match self.buffer.rfind('[') {
        Some(index) => index,
        None => return false,
    };

    // detect escape
    if index == 0 && matches!(self.parts.last(), Some(Part::Escape)) {
      return false;
    }

    // extract the tag body
    let body = &self.buffer[index+1..];

    // parse the tag
    let part = Part::parse_tag(body);

    // if we parsed a tag
    if let Some(part) = part {
      // remove the tag from the buffer
      self.buffer.drain(index..);
      // emit both the remaining buffer and the parsed part
      self.flush();
      self.emit(part);
      // success!
      true
    } else {
      // we did not parse a tag :<
      false
    }
  }

  /// parses sillycode markup
  fn parse(mut self, input: &str) -> Vec<Part> {
    // main parsing loop
    for char in input.chars() {
      // if we are not escaping
      if !self.escape {
        // check for escape
        if char == '\\' {
          self.escape = true;
          self.flush();
          self.emit(Part::Escape);
          continue;
        }
        // check for tag close
        if char == ']' {
          if self.tag() {
            continue;
          }
        }
      }

      // make sure to reset the escape flag
      self.escape = false;

      // check for newline
      if char == '\n' {
        self.flush();
        self.emit(Part::Newline);
        continue;
      }

      // collect normal characters in the buffer
      self.buffer.push(char);
    }

    // flush any remaining text
    self.flush();

    // we are done :3
    self.parts
  }

}

/// parses sillycode markup into a list of [Part]s
pub fn parse(input: &str) -> Vec<Part> {
  Parser::new().parse(input)
}

/// calculates the length of a list of parts
pub fn length(parts: &[Part]) -> usize {
  parts.iter().fold(0, |acc, part| {
    match part {
      Part::Text(text) => acc + text.chars().count(),
      Part::Newline | Part::Emote(_) => acc + 1,
      _ => acc,
    }
  })
}
