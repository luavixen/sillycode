import { test, expect } from 'bun:test';

import { parse, length, StyleKind } from './parser.ts';

test('parse empty string', () => {
  expect(parse('')).toEqual([]);
});

test('parse text', () => {
  expect(parse('hello')).toEqual([{ type: 'text', text: 'hello' }]);
});

test('parse newline', () => {
  expect(parse('hello\nworld')).toEqual([
    { type: 'text', text: 'hello' },
    { type: 'newline' },
    { type: 'text', text: 'world' }
  ]);
});

test('parse basic tags', () => {
  expect(parse('[b]hello[/b] world')).toEqual([
    { type: 'style', style: StyleKind.BOLD, enable: true },
    { type: 'text', text: 'hello' },
    { type: 'style', style: StyleKind.BOLD, enable: false },
    { type: 'text', text: ' world' }
  ]);
});

test('parse nested tags', () => {
  expect(parse('[b]hello [i]world[/i][/b]')).toEqual([
    { type: 'style', style: StyleKind.BOLD, enable: true },
    { type: 'text', text: 'hello ' },
    { type: 'style', style: StyleKind.ITALIC, enable: true },
    { type: 'text', text: 'world' },
    { type: 'style', style: StyleKind.ITALIC, enable: false },
    { type: 'style', style: StyleKind.BOLD, enable: false }
  ]);
});

test('parse color', () => {
  expect(parse('[color=#014554]colored text![/color]')).toEqual([
    { type: 'color', color: '#014554', enable: true },
    { type: 'text', text: 'colored text!' },
    { type: 'color', enable: false }
  ]);
});

test('parse escaped tags', () => {
  expect(parse('\\[[b]hello\\[/b]')).toEqual([
    { type: 'escape' },
    { type: 'text', text: '[' },
    { type: 'style', style: StyleKind.BOLD, enable: true },
    { type: 'text', text: 'hello' },
    { type: 'escape' },
    { type: 'text', text: '[/b]' }
  ]);
});

test('parse incorrectly nested tags and escapes', () => {
  expect(parse('now [b[url]https://[i]example.com[/url] is \\ wrong here \\ [/i] \\')).toEqual([
    { type: 'text', text: 'now [b' },
    { type: 'style', style: StyleKind.LINK, enable: true },
    { type: 'text', text: 'https://' },
    { type: 'style', style: StyleKind.ITALIC, enable: true },
    { type: 'text', text: 'example.com' },
    { type: 'style', style: StyleKind.LINK, enable: false },
    { type: 'text', text: ' is ' },
    { type: 'escape' },
    { type: 'text', text: ' wrong here ' },
    { type: 'escape' },
    { type: 'text', text: ' ' },
    { type: 'style', style: StyleKind.ITALIC, enable: false },
    { type: 'text', text: ' ' },
    { type: 'escape' }
  ]);
});

test('parse a bunch of fake tags', () => {
  expect(parse('these [tags] are invalid ]')).toEqual([
    { type: 'text', text: 'these [tags] are invalid ]' }
  ]);
  expect(parse('[url]]teehee[/color ] yea [] ]')).toEqual([
    { type: 'style', style: StyleKind.LINK, enable: true },
    { type: 'text', text: ']teehee[/color ] yea [] ]' }
  ]);
});

test('length', () => {
  expect(length(parse('hello'))).toBe(5);
  expect(length(parse('hello\nworld'))).toBe(11);
});

test('length with styles', () => {
  expect(length(parse('hello [b]world[/b]'))).toBe(11);
  expect(length(parse('[i]goodnight [b]world[/b]'))).toBe(15);
});

test('length with emotes', () => {
  expect(length(parse('hello world [:D] !'))).toBe(15);
});

test('length with emojis', () => {
  expect(length(parse('🤔☃'))).toBe(2);
  expect(length(parse('this is a fox 🦊 from canada 🇨🇦'))).toBe(30);
});
