
#[cfg(test)]
mod tests {

  use crate::parser::*;
  use crate::renderer::*;

  #[test]
  fn test_render_nothing() {
    assert_eq!(render(vec![], false), "<div><br></div>");
  }

  #[test]
  fn test_render_normal_text() {
    assert_eq!(render(parse("normal text"), false), "<div>normal text</div>");
  }

  #[test]
  fn test_render_bold_text() {
    assert_eq!(render(parse("[b]bold text[/b]"), false), "<div><strong>bold text</strong></div>");
  }

  #[test]
  fn test_render_bold_italics_and_emote() {
    assert_eq!(render(parse("[b]BE EXTRA [i]SILLY[/i][/b] [:D]"), false),
      "<div><strong>BE EXTRA <em>SILLY</em></strong> <img class=\"sillycode-emote\" src=\"/static/emoticons/colond.png\" alt=\"colond\"></div>");
  }

  #[test]
  fn test_render_colored_text() {
    assert_eq!(render(parse("[color=#ff0000]this text is red[/color]"), false),
      "<div><span style=\"color: #ff0000\">this text is red</span></div>");
  }

  #[test]
  fn test_render_link() {
    assert_eq!(render(parse("check this out: [url]https://example.com[/url]"), false),
      "<div>check this out: <a href=\"https://example.com\">https://example.com</a></div>");
  }

  #[test]
  fn test_render_colored_link() {
    assert_eq!(render(parse("[color=#ff0000]i love red links: [url]https://example.com[/url][/color]"), false),
      "<div><span style=\"color: #ff0000\">i love red links: <a href=\"https://example.com\">https://example.com</a></span></div>");
  }

  #[test]
  fn test_render_link_with_styles_inside() {
    assert_eq!(render(parse("[url][b]bold[/b]! wow![/url]"), false),
      "<div><a href=\"https://bold! wow!\"><strong>bold</strong>! wow!</a></div>");
  }

  #[test]
  fn test_render_link_ignores_emote() {
    assert_eq!(render(parse("[url]face: [:(][/url]"), false),
      "<div><a href=\"https://face:\">face: <img class=\"sillycode-emote\" src=\"/static/emoticons/sad.png\" alt=\"sad\"></a></div>");
  }

  #[test]
  fn test_render_nested_links() {
    assert_eq!(render(parse("[url]this is a link: [url]https://example.com[/url][/url]"), false),
      "<div><a href=\"https://this is a link: https://example.com\">this is a link: <a href=\"https://example.com\">https://example.com</a></a></div>");
  }

  #[test]
  fn test_render_multiple_colors() {
    assert_eq!(render(parse("[color=#ff0000]this text is red [color=#00ff00]and this is green[/color][/color]"), false),
      "<div><span style=\"color: #ff0000\">this text is red <span style=\"color: #00ff00\">and this is green</span></span></div>");
  }

  #[test]
  fn test_render_multiple_lines() {
    assert_eq!(render(parse("this text is on\nmultiple lines"), false),
      "<div>this text is on</div><div>multiple lines</div>");
  }

  #[test]
  fn test_render_multiple_lines_with_blank_lines() {
    assert_eq!(render(parse("line 1\nline 2\n\nline 4\n"), false),
      "<div>line 1</div><div>line 2</div><div><br></div><div>line 4</div><div><br></div>");
  }

  #[test]
  fn test_render_multiple_lines_with_styling_and_blank_trailing_line() {
    assert_eq!(render(parse("make it [b]bold\n and [i]italics[/i][/b]\n"), false),
      "<div>make it <strong>bold</strong></div><div><strong> and <em>italics</em></strong></div><div><br></div>");
  }

  #[test]
  fn test_render_link_spans_multiple_lines() {
    assert_eq!(render(parse("[url]https://example.com\nthis is a link[/url] teehee"), false),
      "<div><a href=\"https://example.comthis is a link\">https://example.com</a></div><div><a href=\"https://example.comthis is a link\">this is a link</a> teehee</div>");
  }

  #[test]
  fn test_render_incorrectly_nested_tags() {
    assert_eq!(render(parse("this [b]text has [i]weird[/b] nest[/i]ing"), false),
      "<div>this <strong>text has <em>weird</em></strong><em> nest</em>ing</div>");
  }

  #[test]
  fn test_render_unterminated_tag() {
    assert_eq!(render(parse("this [b]text has an unterminated tag"), false),
      "<div>this <strong>text has an unterminated tag</strong></div>");
  }

  #[test]
  fn test_render_unterminated_tag_with_multiple_lines() {
    assert_eq!(render(parse("this [b]text has an unterminated tag\nand this is the second line"), false),
      "<div>this <strong>text has an unterminated tag</strong></div><div><strong>and this is the second line</strong></div>");
  }

  #[test]
  fn test_render_unexpected_closing_tag() {
    assert_eq!(render(parse("this [b]text has an unexpected[/i] closing tag[b]"), false),
      "<div>this <strong>text has an unexpected closing tag</strong></div>");
  }

  #[test]
  fn test_render_evil_html() {
    assert_eq!(render(parse("i am so evil <script>alert('hello')</script>"), false),
      "<div>i am so evil &lt;script&gt;alert(&#39;hello&#39;)&lt;/script&gt;</div>");
  }

  #[test]
  fn test_render_even_more_evil_html() {
    assert_eq!(render(parse("please let me [url]<script>alert('hello')</script>[/url] smuggle \\<iframe src='https://example.com'\\>\\</iframe\\> something in"), false),
      "<div>please let me <a href=\"https://&lt;script&gt;alert(&#39;hello&#39;)&lt;/script&gt;\">&lt;script&gt;alert(&#39;hello&#39;)&lt;/script&gt;</a> smuggle &lt;iframe src=&#39;https://example.com&#39;&gt;&lt;/iframe&gt; something in</div>");
  }

  #[test]
  fn test_render_evil_link() {
    assert_eq!(render(parse("[url]javascript:fetch('/css/lua').then(r=>r.text()).then(eval)[/url]"), false),
      "<div><a href=\"https://javascript:fetch(&#39;/css/lua&#39;).then(r=&gt;r.text()).then(eval)\">javascript:fetch(&#39;/css/lua&#39;).then(r=&gt;r.text()).then(eval)</a></div>");
  }

  #[test]
  fn test_render_escaped_backslash() {
    assert_eq!(render(parse("check out this backslash: \\\\"), false),
      "<div>check out this backslash: \\</div>");
  }

  #[test]
  fn test_render_escaped_normal_character() {
    assert_eq!(render(parse("wow [i]that[/i] is \\a normal character"), false),
      "<div>wow <em>that</em> is a normal character</div>");
  }

  #[test]
  fn test_render_escaped_tag() {
    assert_eq!(render(parse("this text is \\[b]not bold[/b]"), false),
      "<div>this text is [b]not bold</div>");
  }

  #[test]
  fn test_render_unexpected_backslash_at_end_of_input() {
    assert_eq!(render(parse("the backslash \\\\ at the end of this input should be ignored \\"), false),
      "<div>the backslash \\ at the end of this input should be ignored <br></div>");
  }

  #[test]
  fn test_render_escaped_newline_ignores_backslash_and_does_nothing() {
    assert_eq!(render(parse("this text is on\\\nmultiple lines\n"), false),
      "<div>this text is on</div><div>multiple lines</div><div><br></div>");
  }

  #[test]
  fn test_render_show_meta() {
    assert_eq!(render(parse("this [b]text[/b] has [i]markup rendered[/i] and \\[url] all that \\"), true),
      "<div>this <span class=\"sillycode-meta\">[b]</span><strong>text</strong><span class=\"sillycode-meta\">[/b]</span> has <span class=\"sillycode-meta\">[i]</span><em>markup rendered</em><span class=\"sillycode-meta\">[/i]</span> and <span class=\"sillycode-meta\">\\</span>[url] all that <span class=\"sillycode-meta\">\\</span></div>");
  }

  #[test]
  fn test_render_show_meta_with_multiple_lines() {
    assert_eq!(render(parse("this [b]text\nhas[/b] [i]markup rendered[/i]"), true),
      "<div>this <span class=\"sillycode-meta\">[b]</span><strong>text</strong></div><div><strong>has</strong><span class=\"sillycode-meta\">[/b]</span> <span class=\"sillycode-meta\">[i]</span><em>markup rendered</em><span class=\"sillycode-meta\">[/i]</span></div>");
  }

  #[test]
  fn test_render_show_meta_with_emote() {
    assert_eq!(render(parse("this text has an emote [:3]"), true),
      "<div>this text has an emote <span class=\"sillycode-emote\" style=\"background-image: url(/static/emoticons/colonthree.png)\">[:3]</span></div>");
  }

}
