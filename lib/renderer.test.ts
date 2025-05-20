import { test, expect } from 'bun:test';

import { parse } from './parser.ts';
import { render } from './renderer.ts';

test('normal text', () => {
  expect(render(parse('normal text')))
    .toBe('<div>normal text</div>');
});

test('bold text', () => {
  expect(render(parse('[b]bold text[/b]')))
    .toBe('<div><strong>bold text</strong></div>');
});

test('bold, italics, and emote', () => {
  expect(render(parse('[b]BE EXTRA [i]SILLY[/i][/b] [:D]')))
    .toBe('<div><strong>BE EXTRA <em>SILLY</em></strong> <img class="sillycode-emote" src="/static/emoticons/colond.png" alt="colond"></div>');
});

test('colored text', () => {
  expect(render(parse('[color=#ff0000]this text is red[/color]')))
    .toBe('<div><span style="color: #ff0000">this text is red</span></div>');
});

test('link', () => {
  expect(render(parse('check this out: [url]https://example.com[/url]')))
    .toBe('<div>check this out: <a href="https://example.com">https://example.com</a></div>');
});

test('colored link', () => {
  expect(render(parse('[color=#ff0000]i love red links: [url]https://example.com[/url][/color]')))
    .toBe('<div><span style="color: #ff0000">i love red links: <a href="https://example.com">https://example.com</a></span></div>');
});

test('link with styles inside', () => {
  expect(render(parse('[url][b]bold[/b]! wow![/url]')))
    .toBe('<div><a href="bold! wow!"><strong>bold</strong>! wow!</a></div>');
});

test('link ignores emote', () => {
  expect(render(parse('[url]face: [:(][/url]')))
    .toBe('<div><a href="face:">face: <img class="sillycode-emote" src="/static/emoticons/sad.png" alt="sad"></a></div>');
});

test('nested links', () => {
  expect(render(parse('[url]this is a link: [url]https://example.com[/url][/url]')))
    .toBe('<div><a href="this is a link: https://example.com">this is a link: <a href="https://example.com">https://example.com</a></a></div>');
});

test('multiple colors', () => {
  expect(render(parse('[color=#ff0000]this text is red [color=#00ff00]and this is green[/color][/color]')))
    .toBe('<div><span style="color: #ff0000">this text is red <span style="color: #00ff00">and this is green</span></span></div>');
});

test('multiple lines', () => {
  expect(render(parse('this text is on\nmultiple lines')))
    .toBe('<div>this text is on</div><div>multiple lines</div>');
});

test('multiple lines with blank lines', () => {
  expect(render(parse('line 1\nline 2\n\nline 4\n')))
    .toBe('<div>line 1</div><div>line 2</div><div></div><div>line 4</div><div></div>');
});

test('multiple lines with styling and a blank trailing line', () => {
  expect(render(parse('make it [b]bold\n and [i]italics[/i][/b]\n')))
    .toBe('<div>make it <strong>bold</strong></div><div><strong> and <em>italics</em></strong></div><div></div>');
});

test('link spans multiple lines', () => {
  // nobody should ever do this, but this behaviour is defined
  // note that the href only contains the current line
  expect(render(parse('[url]https://example.com\nthis is a link[/url] teehee')))
    .toBe('<div><a href=\"https://example.com\">https://example.com</a></div><div><a href=\"this is a link\">this is a link</a> teehee</div>');
});

test('incorrectly nested tags', () => {
  // note the </em></strong><em> generated from only the [/b]
  expect(render(parse('this [b]text has [i]weird[/b] nest[/i]ing')))
    .toBe('<div>this <strong>text has <em>weird</em></strong><em> nest</em>ing</div>');
});

test('unterminated tag', () => {
  expect(render(parse('this [b]text has an unterminated tag')))
    .toBe('<div>this <strong>text has an unterminated tag</strong></div>');
});

test('unterminated tag with multiple lines', () => {
  // the style continues onto the next line
  expect(render(parse('this [b]text has an unterminated tag\nand this is the second line')))
    .toBe('<div>this <strong>text has an unterminated tag</strong></div><div><strong>and this is the second line</strong></div>');
});

test('unexpected closing tag', () => {
  // note how the [/i] is ignored
  expect(render(parse('this [b]text has an unexpected[/i] closing tag[b]')))
    .toBe('<div>this <strong>text has an unexpected closing tag</strong></div>');
});

test('escaped backslash', () => {
  expect(render(parse('check out this backslash: \\\\')))
    .toBe('<div>check out this backslash: \\</div>');
});

test('escaped normal character', () => {
  expect(render(parse('wow [i]that[/i] is \\a normal character')))
    .toBe('<div>wow <em>that</em> is a normal character</div>');
});

test('escaped tag', () => {
  expect(render(parse('this text is \\[b]not bold[/b]')))
    .toBe('<div>this text is [b]not bold</div>');
});

test('unexpected backslash at end of input', () => {
  expect(render(parse('the backslash \\\\ at the end of this input should be ignored \\')))
    .toBe('<div>the backslash \\ at the end of this input should be ignored </div>');
});

test('escaped newline ignores backslash and does nothing', () => {
  expect(render(parse('this text is on\\\nmultiple lines\n')))
    .toBe('<div>this text is on</div><div>multiple lines</div><div></div>');
});

test('show markup', () => {
  expect(render(parse('this [b]text[/b] has [i]markup rendered[/i] and \\[url] all that \\'), true))
    .toBe('<div>this <span class="sillycode-markup">[b]</span><strong>text</strong><span class="sillycode-markup">[/b]</span> has <span class="sillycode-markup">[i]</span><em>markup rendered</em><span class="sillycode-markup">[/i]</span> and <span class="sillycode-markup">\\</span>[url] all that <span class="sillycode-markup">\\</span></div>');
});

test('show markup with multiple lines', () => {
  expect(render(parse('this [b]text\nhas[/b] [i]markup rendered[/i]'), true))
    .toBe('<div>this <span class=\"sillycode-markup\">[b]</span><strong>text</strong></div><div><strong>has</strong><span class=\"sillycode-markup\">[/b]</span> <span class=\"sillycode-markup\">[i]</span><em>markup rendered</em><span class=\"sillycode-markup\">[/i]</span></div>');
});

test('show markup with emote', () => {
  expect(render(parse('this text has an emote [:3]'), true))
    .toBe('<div>this text has an emote <span class="sillycode-emote" style="background-image: url(/static/emoticons/colonthree.png)">[:3]</span></div>');
});
