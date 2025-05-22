import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

import { test, expect } from 'bun:test';

import { parse } from './parser.ts';
import { render } from './renderer.ts';
import { reverse, diff } from './dom.ts';

function expectReverseRoundTrip(input: string): void {
  var $root = document.createElement('div');

  // render the input
  var html = render(parse(input), true);

  // parse the rendered html
  $root.innerHTML = html;

  // reverse the rendered html
  var output = reverse($root);

  // expect the input to be exactly equal to the output
  expect(output).toBe(input);
}

test('reverse: normal text', () => {
  expectReverseRoundTrip('this is just some normal text');
});

test('reverse: with styles', () => {
  expectReverseRoundTrip('this text has [b]bold[/b] and [i]italics[/i] in it!');
});

test('reverse: with emote', () => {
  expectReverseRoundTrip('this text has an emote [:3] yay!');
});

test('reverse: multiple lines', () => {
  expectReverseRoundTrip('this text is on\nmultiple lines, and has a trailing newline\n');
});

test('reverse: complex example', () => {
  expectReverseRoundTrip(`

    let's [i]just go off the [b]rails[/i] here[/b]

    <script src="https://foxgirl.dev/evil.js"></script>\\

    [color=#0000ff] let's make it all [u]BLUE[/u]

    \\\\\\\\\\\\\

    \hello \[:3] \[i]

    [url]https://example.com
    // [:3] [/i] [/url]

    [/s][b][s][b][b]this text is partially bold, [b]strikethrough[/b], and [i]italics[/i][/s]

    [url]

      here's a nested [color=#00ff00][color=#00ff00][color=#00ff00]

      [url] multi line [color=#ff0000]
      [url] now [i] that's crazy

        colored url !! :D [/url][url]teehee[/url]

      [/url] let's just never terminate that url

    yadda yadda \\

  `);
});

function renderSillycodeIntoDiv(markup: string, isEditor?: boolean): HTMLDivElement {
  var $root = document.createElement('div');

  $root.innerHTML = render(parse(markup), isEditor);

  return $root;
}

test('diff: no changes', () => {
  var $expected = renderSillycodeIntoDiv('hello guys [i]it\'s me![/i] [:3] teehee');
  var $actual = renderSillycodeIntoDiv('hello guys [i]it\'s me![/i] [:3] teehee');

  var dirty = diff($expected, $actual);

  expect(dirty).toBe(false);
  expect($actual.innerHTML).toBe($expected.innerHTML);
});

test('diff: basic differences', () => {
  var $expected = renderSillycodeIntoDiv('hello guys [i]it\'s me![/i] [:3] teehee');
  var $actual = renderSillycodeIntoDiv('hello guys [b]it\'s me![/b] [:)] teehee');

  expect($actual.innerHTML).not.toBe($expected.innerHTML);

  var dirty = diff($expected, $actual);

  expect(dirty).toBe(true);
  expect($actual.innerHTML).toBe($expected.innerHTML);
});

test('diff: more advanced differences also in editor mode', () => {
  var $expected = renderSillycodeIntoDiv('\\[:3] this text has [b]bold[/b] and [i]italics[/i] in it!', true);
  var $actual = renderSillycodeIntoDiv('\\[:3] this text has bold and [s]strikethrough[/s] in it!', true);

  expect($actual.innerHTML).not.toBe($expected.innerHTML);

  var dirty = diff($expected, $actual);

  expect(dirty).toBe(true);
  expect($actual.innerHTML).toBe($expected.innerHTML);
});

test('diff: multiple lines', () => {
  var $expected = renderSillycodeIntoDiv('this text is on\nmultiple lines, and has a trailing newline\n');
  var $actual = renderSillycodeIntoDiv('this text is on multiple lines, and has a trailing newline\n\n');

  var dirty = diff($expected, $actual);

  expect(dirty).toBe(true);
  expect($actual.innerHTML).toBe($expected.innerHTML);
});

test('diff: avoids unnecessary changes', () => {
  var $expected = renderSillycodeIntoDiv('this text has a [i]few [:3][/i] differences: [url]https://example.com/[u]gwa[/u][/url] yea...');
  var $actual = renderSillycodeIntoDiv('this text has a [b]few [:D][/b] differences: [url]https://foxgirl.dev/[u]gwa[/u][/url] yea...');

  var $oldFirstText = $actual.firstChild;
  var $oldEmote = $actual.querySelector('img');
  var $oldUnderline = $actual.querySelector('u');
  var $oldLastText = $actual.lastChild;

  var dirty = diff($expected, $actual);

  expect(dirty).toBe(true);
  expect($actual.innerHTML).toBe($expected.innerHTML);

  var $newFirstText = $actual.firstChild;
  var $newEmote = $actual.querySelector('img');
  var $newUnderline = $actual.querySelector('u');
  var $newLastText = $actual.lastChild;

  expect($newFirstText).toBe($oldFirstText);
  expect($newEmote).toBe($oldEmote);
  expect($newUnderline).toBe($oldUnderline);
  expect($newLastText).toBe($oldLastText);
});
