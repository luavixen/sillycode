
#[cfg(test)]
mod tests {

  use crate::parser::*;

  #[test]
  fn test_parse_empty_string() {
    assert_eq!(parse(""), vec![]);
  }

  #[test]
  fn test_parse_text() {
    assert_eq!(parse("hello"), vec![Part::Text("hello".to_string())]);
  }

  #[test]
  fn test_parse_newline() {
    assert_eq!(
      parse("hello\nworld"),
      vec![
        Part::Text("hello".to_string()),
        Part::Newline,
        Part::Text("world".to_string())
      ]
    );
  }

  #[test]
  fn test_parse_basic_tags() {
    assert_eq!(
      parse("[b]hello[/b] world"),
      vec![
        Part::Style(StyleKind::Bold, true),
        Part::Text("hello".to_string()),
        Part::Style(StyleKind::Bold, false),
        Part::Text(" world".to_string())
      ]
    );
  }

  #[test]
  fn test_parse_nested_tags() {
    assert_eq!(
      parse("[b]hello [i]world[/i][/b]"),
      vec![
        Part::Style(StyleKind::Bold, true),
        Part::Text("hello ".to_string()),
        Part::Style(StyleKind::Italic, true),
        Part::Text("world".to_string()),
        Part::Style(StyleKind::Italic, false),
        Part::Style(StyleKind::Bold, false)
      ]
    );
  }

  #[test]
  fn test_parse_color() {
    let color = Color::new(168, 52, 207);
    assert_eq!(
      parse("[color=#a834cf]colored text![/color]"),
      vec![
        Part::Color(color, true),
        Part::Text("colored text!".to_string()),
        Part::Color(Color::default(), false)
      ]
    );
  }

  #[test]
  fn test_parse_escaped_tags() {
    assert_eq!(
      parse("\\[[b]hello\\[/b]"),
      vec![
        Part::Escape,
        Part::Text("[".to_string()),
        Part::Style(StyleKind::Bold, true),
        Part::Text("hello".to_string()),
        Part::Escape,
        Part::Text("[/b]".to_string())
      ]
    );
  }

  #[test]
  fn test_parse_incorrectly_nested_tags_and_escapes() {
    assert_eq!(
      parse("now [b[url]https://[i]example.com[/url] is \\ wrong here \\ [/i] \\"),
      vec![
        Part::Text("now [b".to_string()),
        Part::Style(StyleKind::Link, true),
        Part::Text("https://".to_string()),
        Part::Style(StyleKind::Italic, true),
        Part::Text("example.com".to_string()),
        Part::Style(StyleKind::Link, false),
        Part::Text(" is ".to_string()),
        Part::Escape,
        Part::Text(" wrong here ".to_string()),
        Part::Escape,
        Part::Text(" ".to_string()),
        Part::Style(StyleKind::Italic, false),
        Part::Text(" ".to_string()),
        Part::Escape
      ]
    );
  }

  #[test]
  fn test_parse_a_bunch_of_fake_tags() {
    assert_eq!(
      parse("these [tags] are invalid ]"),
      vec![Part::Text("these [tags] are invalid ]".to_string())]
    );
    assert_eq!(
      parse("[url]]teehee[/color ] yea [] ]"),
      vec![
        Part::Style(StyleKind::Link, true),
        Part::Text("]teehee[/color ] yea [] ]".to_string())
      ]
    );
  }

  #[test]
  fn test_length_normal_text() {
    assert_eq!(length(&parse("hello")), 5);
    assert_eq!(length(&parse("hello\nworld")), 11);
  }

  #[test]
  fn test_length_with_styles() {
    assert_eq!(length(&parse("hello [b]world[/b]")), 11);
    assert_eq!(length(&parse("[i]goodnight [b]world[/b]")), 15);
  }

  #[test]
  fn test_length_with_emotes() {
    assert_eq!(length(&parse("hello world [:D] !")), 15);
  }

  #[test]
  fn test_length_with_emojis() {
    assert_eq!(length(&parse("🤔☃")), 2);
    assert_eq!(length(&parse("this is a fox 🦊 from canada 🇨🇦")), 30);
  }

}
