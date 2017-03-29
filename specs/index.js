let {deepStrictEqual: eq} = require("assert")
let {htmlToHs, htmlToHs2} = require("../src")

let convert = htmlToHs({})
let convert2 = htmlToHs2({})

describe("htmlToHs()", function () {
  it("should convert single tags", function () {
    eq(convert('<div/>'), 'div()')
    eq(convert('<div></div>'), 'div()')
    eq(convert('<div><span></span></div>'), 'div([\n  span()\n])')
  })

  it("should convert text nodes", function () {
    eq(convert('<div>t1</div>'), 'div([`t1`])')
    eq(convert('<div><span>t1</span></div>'), 'div([\n  span([`t1`])\n])')
    eq(convert('<div>t1<span>t2</span>t3</div>'), 'div([\n  `t1`,\n  span([`t2`]),\n  `t3`\n])')
  })

  it("should convert comments", function () {
    eq(convert('<div><!-- c1 --></div>'), 'div(/* c1 */)')
    eq(convert('<div>t1<span>t2</span><!-- c1 --><!-- c2 --></div>'), 'div([\n  `t1`,\n  span([`t2`])\n  /* c1 */\n  /* c2 */\n])')
    eq(convert('<div><!-- c1 --><!-- c2 -->t1<span>t2</span></div>'), 'div([\n  /* c1 */\n  /* c2 */\n  `t1`,\n  span([`t2`])\n])')
    eq(convert('<!-- c1 --><!-- c2 -->'), '[\n  /* c1 */\n  /* c2 */\n]')
  })

  it("should ignore whitespace around root", function () {
    eq(convert(' <div/> '), 'div()')
  })

  it("should support multiple roots", function () {
    eq(convert('<p/><p/>'), '[\n  p(),\n  p()\n]')
  })

  it("should treat broken tags as text", function () {
    eq(convert('<div'), '`<div`')
    eq(convert('< div>typo!</div>'), '`< div>typo!`')
    eq(convert('<div>< p>typo!'), 'div([`< p>typo!`])')
  })

  it("should strip insignificant whitespace", function () {
    eq(convert('<div>\n \n</div>'), 'div([])')
    eq(convert('<div>\n  <span> </span>  \n</div>'), 'div([\n  span([])\n])')
  })

  it("should preserve whitespace before and after inline tags", function () {
    eq(
      convert('<div>foo <span>bar</span> bazz</div>'),
      'div([\n  `foo `,\n  span([`bar`]),\n  ` bazz`\n])'
    )
  })

  it("should autoclose tags", function () {
    let html = `
      <ul>
        <li>1</li>
        <li>2
      </ul>
    `
    eq(convert(html), 'ul([\n  li([`1`]),\n  li([`2`])\n])')
  })

  it("should convert selectors", function () {
    eq(convert('<div id="gizmo"></div>'), 'div("#gizmo")')
    eq(convert('<div class="foo bar"></div>'), 'div(".foo.bar")')
    eq(convert('<div id="gizmo" class="foo bar"></div>'), 'div("#gizmo.foo.bar")')
    eq(convert('<div className="alt"></div>'), 'div(".alt")')
  })

  it("should convert attributes", function () {
    eq(
      convert('<div foo="bar"></div>'),
      'div({\n  "attributes": {\n    "foo": "bar"\n  }\n})'
    )
    eq(
      convert('<div foo="bar"><span></span></div>'),
      'div({\n  "attributes": {\n    "foo": "bar"\n  }\n}, [\n  span()\n])'
    )
    eq(
      convert('<div><span foo="bar"></span></div>'),
      'div([\n  span({\n    "attributes": {\n      "foo": "bar"\n    }\n  })\n])'
    )
  })

  it("should parse style into object", function () {
    eq(
      convert('<div style="color:white!important ; background-color: black"></div>'),
      'div({\n  "style": {\n    "color": "white!important",\n    "background-color": "black"\n  }\n})'
    )
  })

  describe("opts.tabSize", function () {
    it("should control tabSize", function () {
      let html = `<div><span></span></div>`
      eq(htmlToHs({tabSize: 4}, html), 'div([\n    span()\n])')
    })
  })

  describe("opts.syntax", function () {
    it("should control syntax", function () {
      let html1 = `<div><span></span></div>`
      eq(htmlToHs({syntax: "h"}, html1), 'h("div", [\n  h("span")\n])')

      let html2 = `<div class="foo"></div>`
      eq(htmlToHs({syntax: "h"}, html2), 'h("div.foo")')

      let html3 = `<div class="foo"><span></span></div>`
      eq(htmlToHs({syntax: "h"}, html3), 'h("div.foo", [\n  h("span")\n])')

      let html4 = `<div>test</div>`
      eq(htmlToHs({syntax: "h"}, html4), 'h("div", `test`)')
    })
  })
})

describe("htmlToHs2()", function () {
  it("should return result pair", function () {
    eq(convert2('<div/>'), ["div()", ["div"]])
  })

  it("should count tags correctly", function () {
    eq(convert2('<div/><span/>')[1], ["div", "span"])
    eq(convert2('<div><span/><p/></div>')[1], ["div", "p", "span"])
    eq(convert2('<div></span><p></div>')[1], ["div", "p"])
  })
})
