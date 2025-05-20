# sillycode

<pre>
sillycode is a bbcode-like markup language that lets you do cool things with your posts :3

for example, you can turn text content like:
[b]BE EXTRA [i]SILLY[/i][/b] [:D]

into this:
<strong>BE EXTRA <em>SILLY</em></strong> <img src="/static/emoticons/colond.png?v=1" alt="colond.png">

tags:
[b]bold[/b] - <strong>bold</strong>
[i]italics[/i] - <em>italics</em>
[u]underline[/u] - <ins>underline</ins>
[s]strikethrough[/s] - <del>strikethrough</del>
[url]https://example.com[/url] - <a href="https://example.com">https://example.com</a>
[color=#ff0000]color[/color] - <span style="color: #ff0000">color</span>

emoticons:
[:)] - <img src="/static/emoticons/smile.png" alt="smile.png">
[:(] - <img src="/static/emoticons/sad.png" alt="sad.png">
[:D] - <img src="/static/emoticons/colond.png" alt="colond.png">
[:3] - <img src="/static/emoticons/colonthree.png" alt="colonthree.png">
[D:] - <img src="/static/emoticons/fearful.png" alt="fearful.png">
[B)] - <img src="/static/emoticons/sunglasses.png" alt="sunglasses.png">
[;(] - <img src="/static/emoticons/crying.png" alt="crying.png">
[;)] - <img src="/static/emoticons/winking.png" alt="winking.png">

sillycode can be nested or escaped with a backslash,
all backslashes are removed when rendering unless you prefix them with a backslash

so to render \\, you would write \\\\
</pre>
