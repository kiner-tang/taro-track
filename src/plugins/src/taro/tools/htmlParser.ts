//Crucial Change
// Regular Expressions for parsing tags and attributes
//这里的startTag和attr不需要改，在2sjon文件里改就可以了
const startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
  endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
  attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

//Crucial Change
// Empty Elements - HTML 5
const empty = makeMap("input,image,map");
// empty = makeMap("view,scrollview,swiper,icon,text,progress,button,action-sheet,form,modal,input,progress,checkbox,toast,radio,picker,slider,navigator,switch,label,audio,map,image,video,canvas");
// Block Elements - HTML 5
const block = makeMap("block,view,scrollview,swiper,icon,text,progress,button,action-sheet,form,modal,input,progress,checkbox,toast,radio,picker,slider,navigator,switch,label,audio,map,image,video,canvas");

// Inline Elements - HTML 5
// 解决button标签闭合bug
const inline = makeMap("icon,progress,input,image,map");

// const inline = makeMap("icon,progress,button,input,image,map");
// inline = makeMap("view,scrollview,swiper,icon,text,progress,button,action-sheet,form,modal,input,progress,checkbox,toast,radio,picker,slider,navigator,switch,label,audio,map,image,video,canvas");
// Elements that you can, intentionally, leave open
// (and which close themselves)
//微信小程序里没有可以不闭合的标签
const closeSelf = makeMap("");

// Attributes that have their values filled in disabled="disabled"
//填充的属性可以后面再解析出来
const fillAttrs = makeMap("");

// Special Elements (can contain anything)
const special = makeMap("wxxxcode-style,script,style");

export function makeMap(str: string) {
  const obj:any = {}, items = str.split(",");
  for (let i = 0; i < items.length; i++)
    obj[items[i]] = true;
  return obj;
}

export interface HtmlParserHanderStruct {
  start(tag:string, attrs: any, unary: boolean): void;
  end(tag: string): void;
  chars(text: string): void;
  comment(text: string): void;
}

export function HTMLParser(html: string, handler:HtmlParserHanderStruct) {
  let index, chars, match, stack:any = [], last = html;
  stack.last = function () {
    return this[this.length - 1];
  };
  while (html) {
    chars = true;

    // Make sure we're not in a script or style element
    if (!stack.last() || !special[stack.last()]) {

      // Comment
      if (html.indexOf("<!--") == 0) {
        index = html.indexOf("-->");
        if (index >= 0) {
          if (handler.comment)
            handler.comment(html.substring(4, index));
          html = html.substring(index + 3);
          chars = false;
        }

        // end tag
      } else if (html.indexOf("</") == 0) {
        match = html.match(endTag);

        if (match) {
          html = html.substring(match[0].length);
          // @ts-ignore
          match[0].replace(endTag, parseEndTag);
          chars = false;
        }

        // start tag
      } else if (html.indexOf("<") == 0) {
        match = html.match(startTag);

        if (match) {
          html = html.substring(match[0].length);
          // @ts-ignore
          match[0].replace(startTag, parseStartTag);
          chars = false;
        }
      }

      if (chars) {
        index = html.indexOf("<");

        let text = index < 0 ? html : html.substring(0, index);
        html = index < 0 ? "" : html.substring(index);

        if (handler.chars)
          handler.chars(text);
      }

    } else {
      html = html.replace(new RegExp("([\\s\\S]*?)<\/" + stack.last() + "[^>]*>"), function (all, text) {
        text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, "$1$2");
        if (handler.chars)
          handler.chars(text);

        return "";
      });

      parseEndTag("", stack.last());
    }

    if (html == last){
      // console.log(html)
      throw "Parse Error: " + html;
    }
    last = html;
  }

  // Clean up any remaining tags
  parseEndTag();

  function parseStartTag(tag: string, tagName: string, rest: string, unary: boolean) {
    tagName = tagName.toLowerCase();

    if (block[tagName]) {
      while (stack.last() && inline[stack.last()]) {
        parseEndTag("", stack.last());
      }
    }

    if (closeSelf[tagName] && stack.last() == tagName) {
      parseEndTag("", tagName);
    }

    unary = empty[tagName] || !!unary;

    if (!unary)
      stack.push(tagName);

    if (handler.start) {
      const attrs:any[] = [];

      // @ts-ignore
      rest.replace(attr, function (match, name) {
        const value = arguments[2] ? arguments[2] :
          arguments[3] ? arguments[3] :
            arguments[4] ? arguments[4] :
              fillAttrs[name] ? name : "";

        attrs.push({
          name: name,
          value: value,
          escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
        });
      });

      if (handler.start)
        handler.start(tagName, attrs, unary);
    }
  }

  function parseEndTag(tag?: string, tagName?: string) {
    // If no tag name is provided, clean shop
    let pos = 0;
    if (!tagName)
      pos = 0;

    // Find the closest opened tag of the same type
    else
      for (pos = stack.length - 1; pos >= 0; pos--)
        if (stack[pos] == tagName)
          break;

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--)
        if (handler.end)
          handler.end(stack[i]);

      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
}
