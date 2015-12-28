# HTML to HyperScript

**html-to-hyperscript** converts HTML to HyperScript.<br/>
Supports both [original](https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript) and
[hypescript-helpers](https://github.com/ohanhi/hyperscript-helpers) syntaxes.<br/>
Here and below first syntax is referenced as H, second – as HH.

## Install

```
$ npm install html-to-hyperscript --save
```

## Use

**test.js**
```js
import {htmlToHs} from "html-to-hyperscript";

let convert = htmlToHs({tabSize: 4});

console.log(
  convert("<div>foo <span>bar</span></div>")
);
```

**$ babel-node test.js**
```
div([
  `foo `,
  span([`bar`])
])
```

## API

Functions correspond to **html-to-hyperscript** default export.<br/>
Exported function are curried.

### `htmlToHs :: Opts -> String -> String`

Converts HTML string to HyperScript string
according to passed options.

### Example

```js
> let convert = htmlToHs({});

> convert('<div class="foo"></div>');
'div(".foo")'

> convert('<a rel="stylesheet">public/bundle.css</a>');
'a({\n  "attributes": {\n  "rel": "stylesheet"\n  }\n}, [`public/bundle.css`])'

> convert('<div><span>foo</span></div>');
'div([\n  span([`foo`])\n])'

> let convert = htmlToHs({syntax: "h"});

> convert('<div><span>foo</span></div>');
'h("div", [\n  h("span", [`foo`])\n])'
```

### `htmlToHs2 :: Opts -> String -> [String, [String]]`

Converts HTML string to HyperScript string according to passed options,
keeping a list of used tagnames. Use with HH syntax.

### Example

```js
> let [_, usedTagNames] = htmlToHs2({}, "<div><i>italic</i><b>bold #1</b><b>bold #2</b></div>");

> usedTagNames
['b', 'i', 'div']

> `let {${usedTagNames.join(", ")}} = hh(h);`.
'let {b, i, div} = hh(h);'
```

### `Opts :: {tabSize :: Number, syntax :: String}`

Options to control rendering.

`tabSize` – number of spaces in "tab". Defaults to `2`.

`syntax` – pass `"h"` for H syntax, `"hh"` for HH syntax. Defaults to `"hh"`.

## Library comparison

<table>
<tr>
  <th rowspan="2">Feature</th>
  <th colspan="3">Library</th>
</tr>
<tr>
  <th><a href="https://github.com/unframework/html2hyperscript"><strong>html2hyperscript</strong></a></th>
  <th><a href="https://github.com/twilson63/html2hscript"><strong>html2hscript</strong></a></th>
  <th><a href="https://github.com/ivan-kleshnin/html-to-hyperscript"><strong>html-to-hyperscript</strong></a></th>
</tr>
<tr>
  <td>Parser engine</td>
  <td><a href="https://github.com/fb55/htmlparser2"><strong>htmlparser2</strong></a></td>
  <td><a href="https://github.com/fb55/htmlparser2"><strong>htmlparser2</strong></a></td>
  <td><a href="https://github.com/inikulin/parse5"><strong>parse5</strong></a></td>
</tr>
<tr>
  <td>Parsing</td>
  <td>async</td>
  <td>async</td>
  <td>sync</td>
</tr>
<tr>
  <td>H syntax</td>
  <td>+</td>
  <td>+</td>
  <td>+</td>
</tr>
<tr>
  <td>HH syntax</td>
  <td>-</td>
  <td>-</td>
  <td>+</td>
</tr>
<tr>
  <td>Respect whitespace</td>
  <td>-</td>
  <td>-</td>
  <td>+</td>
</tr>
</table>

## Dependencies

This repo is made mostly to power a webservice.<br/>
So we don't care much about dependencies.<br/>

[Ramda](https://github.com/ramda/ramda)

[Parse5](https://github.com/inikulin/parse5)

## License

MIT
