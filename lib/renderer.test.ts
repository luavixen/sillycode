import { test, expect } from 'bun:test';

import { parse } from './parser.ts';
import { render } from './renderer.ts';

test('render: nothing', () => {
  expect(render([], false)).toBe('<div><br></div>');
});

test('render: normal text', () => {
  expect(render(parse('normal text')))
    .toBe('<div>normal text</div>');
});

test('render: bold text', () => {
  expect(render(parse('[b]bold text[/b]')))
    .toBe('<div><strong>bold text</strong></div>');
});

test('render: bold, italics, and emote', () => {
  expect(render(parse('[b]BE EXTRA [i]SILLY[/i][/b] [:D]')))
    .toBe('<div><strong>BE EXTRA <em>SILLY</em></strong> <img class="sillycode-emote" src="/static/emoticons/colond.png" alt="colond"></div>');
});

test('render: colored text', () => {
  expect(render(parse('[color=#ff0000]this text is red[/color]')))
    .toBe('<div><span style="color: #ff0000">this text is red</span></div>');
});

test('render: link', () => {
  expect(render(parse('check this out: [url]https://example.com[/url]')))
    .toBe('<div>check this out: <a href="https://example.com">https://example.com</a></div>');
});

test('render: colored link', () => {
  expect(render(parse('[color=#ff0000]i love red links: [url]https://example.com[/url][/color]')))
    .toBe('<div><span style="color: #ff0000">i love red links: <a href="https://example.com">https://example.com</a></span></div>');
});

test('render: link with styles inside', () => {
  expect(render(parse('[url][b]bold[/b]! wow![/url]')))
    .toBe('<div><a href="https://bold! wow!"><strong>bold</strong>! wow!</a></div>');
});

test('render: link ignores emote', () => {
  expect(render(parse('[url]face: [:(][/url]')))
    .toBe('<div><a href="https://face:">face: <img class="sillycode-emote" src="/static/emoticons/sad.png" alt="sad"></a></div>');
});

test('render: nested links', () => {
  expect(render(parse('[url]this is a link: [url]https://example.com[/url][/url]')))
    .toBe('<div><a href="https://this is a link: https://example.com">this is a link: <a href="https://example.com">https://example.com</a></a></div>');
});

test('render: multiple colors', () => {
  expect(render(parse('[color=#ff0000]this text is red [color=#00ff00]and this is green[/color][/color]')))
    .toBe('<div><span style="color: #ff0000">this text is red <span style="color: #00ff00">and this is green</span></span></div>');
});

test('render: multiple lines', () => {
  expect(render(parse('this text is on\nmultiple lines')))
    .toBe('<div>this text is on</div><div>multiple lines</div>');
});

test('render: multiple lines with blank lines', () => {
  expect(render(parse('line 1\nline 2\n\nline 4\n')))
    .toBe('<div>line 1</div><div>line 2</div><div><br></div><div>line 4</div><div><br></div>');
});

test('render: multiple lines with styling and a blank trailing line', () => {
  expect(render(parse('make it [b]bold\n and [i]italics[/i][/b]\n')))
    .toBe('<div>make it <strong>bold</strong></div><div><strong> and <em>italics</em></strong></div><div><br></div>');
});

test('render: link spans multiple lines', () => {
  // nobody should ever do this, but this behaviour is defined
  // note that the href only contains the current line
  expect(render(parse('[url]https://example.com\nthis is a link[/url] teehee')))
    .toBe('<div><a href="https://example.comthis is a link">https://example.com</a></div><div><a href="https://example.comthis is a link">this is a link</a> teehee</div>');
});

test('render: incorrectly nested tags', () => {
  // note the </em></strong><em> generated from only the [/b]
  expect(render(parse('this [b]text has [i]weird[/b] nest[/i]ing')))
    .toBe('<div>this <strong>text has <em>weird</em></strong><em> nest</em>ing</div>');
});

test('render: unterminated tag', () => {
  expect(render(parse('this [b]text has an unterminated tag')))
    .toBe('<div>this <strong>text has an unterminated tag</strong></div>');
});

test('render: unterminated tag with multiple lines', () => {
  // the style continues onto the next line
  expect(render(parse('this [b]text has an unterminated tag\nand this is the second line')))
    .toBe('<div>this <strong>text has an unterminated tag</strong></div><div><strong>and this is the second line</strong></div>');
});

test('render: unexpected closing tag', () => {
  // note how the [/i] is ignored
  expect(render(parse('this [b]text has an unexpected[/i] closing tag[b]')))
    .toBe('<div>this <strong>text has an unexpected closing tag</strong></div>');
});

test('render: evil html', () => {
  expect(render(parse('i am so evil <script>alert(\'hello\')</script>')))
    .toBe('<div>i am so evil &lt;script&gt;alert(&#39;hello&#39;)&lt;/script&gt;</div>');
});

test('render: even more evil html', () => {
  expect(render(parse('please let me [url]<script>alert(\'hello\')</script>[/url] smuggle \\<iframe src=\'https://example.com\'\\>\\</iframe\\> something in')))
    .toBe('<div>please let me <a href=\"https://&lt;script&gt;alert(&#39;hello&#39;)&lt;/script&gt;\">&lt;script&gt;alert(&#39;hello&#39;)&lt;/script&gt;</a> smuggle &lt;iframe src=&#39;https://example.com&#39;&gt;&lt;/iframe&gt; something in</div>');
});

test('render: evil link', () => {
  expect(render(parse('[url]javascript:fetch(\'/css/lua\').then(r=>r.text()).then(eval)[/url]')))
    .toBe('<div><a href="https://javascript:fetch(&#39;/css/lua&#39;).then(r=&gt;r.text()).then(eval)">javascript:fetch(&#39;/css/lua&#39;).then(r=&gt;r.text()).then(eval)</a></div>');
});

test('render: escaped backslash', () => {
  expect(render(parse('check out this backslash: \\\\')))
    .toBe('<div>check out this backslash: \\</div>');
});

test('render: escaped normal character', () => {
  expect(render(parse('wow [i]that[/i] is \\a normal character')))
    .toBe('<div>wow <em>that</em> is a normal character</div>');
});

test('render: escaped tag', () => {
  expect(render(parse('this text is \\[b]not bold[/b]')))
    .toBe('<div>this text is [b]not bold</div>');
});

test('render: unexpected backslash at end of input', () => {
  expect(render(parse('the backslash \\\\ at the end of this input should be ignored \\')))
    .toBe('<div>the backslash \\ at the end of this input should be ignored <br></div>');
});

test('render: escaped newline ignores backslash and does nothing', () => {
  expect(render(parse('this text is on\\\nmultiple lines\n')))
    .toBe('<div>this text is on</div><div>multiple lines</div><div><br></div>');
});

test('render: show meta', () => {
  expect(render(parse('this [b]text[/b] has [i]markup rendered[/i] and \\[url] all that \\'), true))
    .toBe('<div>this <span class="sillycode-meta">[b]</span><strong>text</strong><span class="sillycode-meta">[/b]</span> has <span class="sillycode-meta">[i]</span><em>markup rendered</em><span class="sillycode-meta">[/i]</span> and <span class="sillycode-meta">\\</span>[url] all that <span class="sillycode-meta">\\</span></div>');
});

test('render: show meta with multiple lines', () => {
  expect(render(parse('this [b]text\nhas[/b] [i]markup rendered[/i]'), true))
    .toBe('<div>this <span class="sillycode-meta">[b]</span><strong>text</strong></div><div><strong>has</strong><span class="sillycode-meta">[/b]</span> <span class="sillycode-meta">[i]</span><em>markup rendered</em><span class="sillycode-meta">[/i]</span></div>');
});

test('render: show meta with emote', () => {
  expect(render(parse('this text has an emote [:3]'), true))
    .toBe('<div>this text has an emote <span class="sillycode-emote" style="background-image: url(/static/emoticons/colonthree.png)">[:3]</span></div>');
});
