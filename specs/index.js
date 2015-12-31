import assert from "assert";
import {htmlToHs, htmlToHs2} from "../src";

let convert = htmlToHs({});
let convert2 = htmlToHs2({});

describe("htmlToHs()", function () {
  it("should convert single tags", function () {
    assert.equal(convert('<div/>'), 'div()');
    assert.equal(convert('<div></div>'), 'div()');
    assert.equal(convert('<div><span></span></div>'), 'div([\n  span()\n])');
  });

  it("should convert text nodes", function () {
    assert.equal(convert('<div>t1</div>'), 'div([`t1`])');
    assert.equal(convert('<div><span>t1</span></div>'), 'div([\n  span([`t1`])\n])');
    assert.equal(convert('<div>t1<span>t2</span>t3</div>'), 'div([\n  `t1`,\n  span([`t2`]),\n  `t3`\n])');
  });

  it("should convert comments", function () {
    assert.equal(convert('<div><!-- c1 --></div>'), 'div(/* c1 */)');
    assert.equal(convert('<div>t1<span>t2</span><!-- c1 --><!-- c2 --></div>'), 'div([\n  `t1`,\n  span([`t2`])\n  /* c1 */\n  /* c2 */\n])');
    assert.equal(convert('<div><!-- c1 --><!-- c2 -->t1<span>t2</span></div>'), 'div([\n  /* c1 */\n  /* c2 */\n  `t1`,\n  span([`t2`])\n])');
    assert.equal(convert('<!-- c1 --><!-- c2 -->'), '[\n  /* c1 */\n  /* c2 */\n]');
  });

  it("should ignore whitespace around root", function () {
    assert.equal(convert(' <div/> '), 'div()');
  });

  it("should support multiple roots", function () {
    assert.equal(convert('<p/><p/>'), '[\n  p(),\n  p()\n]');
  });

  it("should treat broken tags as text", function () {
    assert.equal(convert('<div'), '`<div`');
    assert.equal(convert('< div>typo!</div>'), '`< div>typo!`');
    assert.equal(convert('<div>< p>typo!'), 'div([`< p>typo!`])');
  });

  it("should strip insignificant whitespace", function () {
    assert.equal(convert('<div>\n \n</div>'), 'div([])');
    assert.equal(convert('<div>\n  <span> </span>  \n</div>'), 'div([\n  span([])\n])');
  });

  it("should preserve whitespace before and after inline tags", function () {
    assert.equal(
      convert('<div>foo <span>bar</span> bazz</div>'),
      'div([\n  `foo `,\n  span([`bar`]),\n  ` bazz`\n])'
    );
  });

  it("should autoclose tags", function () {
    let html = `
      <ul>
        <li>1</li>
        <li>2
      </ul>
    `;
    assert.equal(convert(html), 'ul([\n  li([`1`]),\n  li([`2`])\n])');
  });

  it("should convert selectors", function () {
    assert.equal(convert('<div id="gizmo"></div>'), 'div("#gizmo")');
    assert.equal(convert('<div class="foo bar"></div>'), 'div(".foo.bar")');
    assert.equal(convert('<div id="gizmo" class="foo bar"></div>'), 'div("#gizmo.foo.bar")');
    assert.equal(convert('<div className="alt"></div>'), 'div(".alt")');
  });

  it("should convert attributes", function () {
    assert.equal(
      convert('<div foo="bar"></div>'),
      'div({\n  "attributes": {\n    "foo": "bar"\n  }\n})'
    );
    assert.equal(
      convert('<div foo="bar"><span></span></div>'),
      'div({\n  "attributes": {\n    "foo": "bar"\n  }\n}, [\n  span()\n])'
    );
    assert.equal(
      convert('<div><span foo="bar"></span></div>'),
      'div([\n  span({\n    "attributes": {\n      "foo": "bar"\n    }\n  })\n])'
    );
  });

  describe("opts.tabSize", function () {
    it("should control tabSize", function () {
      let html = `<div><span></span></div>`;
      assert.equal(htmlToHs({tabSize: 4}, html), 'div([\n    span()\n])');
    });
  });

  describe("opts.syntax", function () {
    it("should control syntax", function () {
      let html1 = `<div><span></span></div>`;
      assert.equal(htmlToHs({syntax: "h"}, html1), 'h("div", [\n  h("span")\n])');

      let html2 = `<div class="foo"></div>`;
      assert.equal(htmlToHs({syntax: "h"}, html2), 'h("div.foo")');

      let html3 = `<div class="foo"><span></span></div>`;
      assert.equal(htmlToHs({syntax: "h"}, html3), 'h("div.foo", [\n  h("span")\n])');

      let html4 = `<div>test</div>`;
      assert.equal(htmlToHs({syntax: "h"}, html4), 'h("div", `test`)');
    });
  });
});

describe("htmlToHs2()", function () {
  it("should return result pair", function () {
    assert.deepEqual(convert2('<div/>'), ["div()", ["div"]]);
  });

  it("should count tags correctly", function () {
    assert.deepEqual(convert2('<div/><span/>')[1], ["div", "span"]);
    assert.deepEqual(convert2('<div><span/><p/></div>')[1], ["div", "p", "span"]);
    assert.deepEqual(convert2('<div></span><p></div>')[1], ["div", "p"]);
  });
});
