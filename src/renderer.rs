use std::fmt::Write;
use std::{rc::Rc, cell::RefCell};

use crate::parser::*;

/// escapes text so it can be safely used in HTML
fn escape_html(text: &str) -> String {
  let mut result = String::with_capacity(text.len());
  for c in text.chars() {
    match c {
      '&' => result.push_str("&amp;"),
      '<' => result.push_str("&lt;"),
      '>' => result.push_str("&gt;"),
      '"' => result.push_str("&quot;"),
      '\'' => result.push_str("&#39;"),
      _ => result.push(c),
    }
  }
  result
}

/// represents a reference to the `href` field of a link in the outputted HTML
#[derive(Debug, Clone)]
struct Link(Rc<RefCell<Option<LinkData>>>);

/// represents the shared data of a [Link]
#[derive(Debug)]
struct LinkData {
  href: String,
  replacer: String,
}

impl Link {

  /// creates a new link with the given id
  fn new(id: u32) -> Self {
    let data = LinkData {
      href: String::new(),
      replacer: format!("§§HREF{id}§§"),
    };

    Self(Rc::new(RefCell::new(Some(data))))
  }

  /// appends text to the link's `href` field
  fn append(&self, text: &str) {
    let mut reference = self.0.borrow_mut();
    let data = reference.as_mut().expect("link already taken");
    data.href.push_str(text)
  }

  /// returns the replacer string of the link
  fn replacer(&self) -> String {
    let reference = self.0.borrow();
    let data = reference.as_ref().expect("link already taken");
    data.replacer.clone()
  }

  /// returns the link's data, removing it from the link
  fn take(&self) -> LinkData {
    self.0.take().expect("link already taken")
  }

}

impl PartialEq<Link> for Link {

  /// checks if two links are the same via pointer equality
  fn eq(&self, other: &Link) -> bool {
    Rc::ptr_eq(&self.0, &other.0)
  }

}

/// represents a HTML element in the element stack
#[derive(Debug, Clone, PartialEq)]
enum Element {
    Strong,
    Em,
    Ins,
    Del,
    Span { color: Color },
    A { link: Link },
}

/// renderer for sillycode markup
#[derive(Default, Debug)]
struct Renderer {
  /// html output
  html: String,

  /// element stack
  elements: Vec<Element>,

  /// counter for link ids
  link_counter: u32,
  /// list of all links
  link_list: Vec<Link>,

  /// whether the output is for an editor or not
  is_editor: bool,
}

/// writes HTML to the renderer's buffer
macro_rules! write_html {
  ($self:ident, $($arg:tt)*) => {
    write!(&mut $self.html, $($arg)*).unwrap()
  }
}

/// writes "meta" text, usually tags like "[url]" or "[b]",
/// wrapped in a span, to the renderer's buffer
macro_rules! write_meta {
  ($self:ident, $($arg:tt)*) => {
    if $self.is_editor {
      write_html!($self, "<span class=\"sillycode-meta\">");
      write_html!($self, $($arg)*);
      write_html!($self, "</span>");
    }
  };
}

impl Renderer {

  /// creates a new renderer
  fn new() -> Self {
    Self::default()
  }

  /// opens an element
  fn open(&mut self, element: &Element) {
    match element {
      Element::Strong => write_html!(self, "<strong>"),
      Element::Em => write_html!(self, "<em>"),
      Element::Ins => write_html!(self, "<ins>"),
      Element::Del => write_html!(self, "<del>"),
      Element::Span { color } => {
        write_html!(self, "<span style=\"color: {color}\">");
      }
      Element::A { link } => {
        write_html!(self, "<a href=\"{}\">", link.replacer());
      }
    }
  }

  /// closes an element
  fn close(&mut self, element: &Element) {
    match element {
      Element::Strong => write_html!(self, "</strong>"),
      Element::Em => write_html!(self, "</em>"),
      Element::Ins => write_html!(self, "</ins>"),
      Element::Del => write_html!(self, "</del>"),
      Element::Span { color: _ } => write_html!(self, "</span>"),
      Element::A { link: _ } => write_html!(self, "</a>"),
    }
  }

  /// opens all elements in the element stack
  fn open_all(&mut self) {
    let elements = self.elements.clone();
    for element in elements.iter() {
      self.open(element);
    }
  }

  /// closes all elements in the element stack in reverse order
  fn close_all(&mut self) {
    let elements = self.elements.clone();
    for element in elements.iter().rev() {
      self.close(element);
    }
  }

  /// pushes an element onto the element stack
  fn push(&mut self, element: Element) {
    self.open(&element);
    self.elements.push(element);
  }

  /// checks if the element stack contains an element
  fn contains(&self, element: &Element) -> bool {
    self.elements.contains(element)
  }

  /// removes an element from the element stack
  fn remove(&mut self, predicate: impl Fn(&Element) -> bool) -> bool {
    for i in (0..self.elements.len()).rev() {
      if predicate(&self.elements[i]) {
        // remove the element from the stack
        let removed: Element = self.elements.remove(i);
        // select all preserved elements
        let preserved: Vec<Element> = self.elements[i..self.elements.len()].into();

        // close all preserved elements, in reverse order
        for element in preserved.iter().rev() {
          self.close(element);
        }

        // close the removed element
        self.close(&removed);

        // re-open all preserved elements
        for element in preserved.iter() {
          self.open(element);
        }

        return true;
      }
    }

    false
  }

  /// applies a specific style element,
  /// possibly pushing/popping from the element stack
  fn apply(&mut self, element: Element, enable: bool) {
    if enable {
      if !self.contains(&element) {
        self.push(element);
      }
    } else {
      self.remove(|e| e == &element);
    }
  }

  /// creates a new link and adds it to the link list,
  /// then pushes it to the element stack
  fn push_link(&mut self) {
    let link = Link::new(self.link_counter);
    self.link_counter += 1;
    self.link_list.push(link.clone());
    self.push(Element::A { link });
  }

  /// appends to all links in the element stack
  fn append_link(&mut self, text: &str) {
    for element in self.elements.iter() {
      if let Element::A { link } = element {
        link.append(text);
      }
    }
  }

  /// handles text parts
  fn on_text(&mut self, text: &str) {
    // escape the text for HTML
    let text = escape_html(text);

    // append the text to the HTML output
    write_html!(self, "{text}");

    // update the link hrefs
    self.append_link(text.as_str());
  }

  /// handles escape parts
  fn on_escape(&mut self) {
    // emit the backslash if isEditor is true
    // we don't need to do anything else! it's handled by the parser
    write_meta!(self, "\\");
  }

  /// handles newline parts
  fn on_newline(&mut self) {
    // close all elements used for styling to get back to the root of the tree
    self.close_all();

    // close and open a new div to start a new line
    write_html!(self, "</div><div>");

    // re-open all elements
    self.open_all();
  }

  /// handles style parts
  fn on_style(&mut self, style: StyleKind, enable: bool) {
    // links are a special case
    if style == StyleKind::Link {
      if enable {
        write_meta!(self, "[url]");
        self.push_link();
      } else {
        self.remove(|e| matches!(e, Element::A { .. }));
        write_meta!(self, "[/url]");
      }
    // all other styles are handled by apply
    } else {
      if enable {
        write_meta!(self, "[{}]", style.to_tag());
      }

      match style {
          StyleKind::Bold => self.apply(Element::Strong, enable),
          StyleKind::Italic => self.apply(Element::Em, enable),
          StyleKind::Underline => self.apply(Element::Ins, enable),
          StyleKind::Strikethrough => self.apply(Element::Del, enable),
          _ => unreachable!(),
      }

      if !enable {
        write_meta!(self, "[/{}]", style.to_tag());
      }
    }
  }

  /// handles color parts
  fn on_color(&mut self, color: Color, enable: bool) {
    if enable {
      write_meta!(self, "[color={color}]");
      self.push(Element::Span { color });
    } else {
      self.remove(|e| matches!(e, Element::Span { .. }));
      write_meta!(self, "[/color]");
    }
  }

  /// handles emote parts
  fn on_emote(&mut self, emote: EmoteKind) {
    let tag = emote.to_tag();
    let name = emote.to_name();
    let path = format!("/static/emoticons/{}.png", name);
    if self.is_editor {
      write_html!(self, "<span class=\"sillycode-emote\" style=\"background-image: url({path})\">[{tag}]</span>");
    } else {
      write_html!(self, "<img class=\"sillycode-emote\" src=\"{path}\" alt=\"{name}\">");
    }
  }

  /// renders a bunch of parts as HTML
  fn render(mut self, parts: impl IntoIterator<Item = Part>) -> String {
    // start the output
    write_html!(self, "<div>");

    // render the parts
    for part in parts {
      match part {
        Part::Text(text) => self.on_text(&text),
        Part::Escape => self.on_escape(),
        Part::Newline => self.on_newline(),
        Part::Style(style, enable) => self.on_style(style, enable),
        Part::Color(color, enable) => self.on_color(color, enable),
        Part::Emote(emote) => self.on_emote(emote),
      }
    }

    // close all elements
    self.close_all();

    // close the output
    write_html!(self, "</div>");

    // replace all link references with the actual hrefs
    for link in self.link_list.iter().map(|link| link.take()) {
      self.html = self.html.replace(&link.replacer, link.href.trim());
    }

    // postprocess the html to add <br> tags where needed
    self.html = self.html
      .replace("<div> ", "<div>&nbsp;")
      .replace(" </div>", " <br></div>")
      .replace("<div></div>", "<div><br></div>");

    // we are done :3
    self.html
  }

}

/// renders a list of [Part]s as HTML,
/// set is_editor to true to include "meta" output like tags and backslashes
pub fn render(parts: impl IntoIterator<Item = Part>, is_editor: bool) -> String {
  let mut renderer = Renderer::new();
  renderer.is_editor = is_editor;
  renderer.render(parts)
}
