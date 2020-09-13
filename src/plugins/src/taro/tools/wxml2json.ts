// @ts-ignore
const {HTMLParser} = require('./htmlParser');

function q(v:string) {
  return '"' + v + '"';
}

//Crucial Change
function removeDOCTYPE(html: string) {
  return html
    .replace(/<\?xml.*\?>\n/, '')
    .replace(/<!doctype.*\>/i, '')
    .replace(/<!DOCTYPE.*\>/, '');
}

interface NodeStruct {
  type?: string,
  tag?: string,
  attr?: Record<string, any>
  text?: string
  children?: NodeStruct[]
}

export function wxml2json(html: string): any {
  html = removeDOCTYPE(html);
  const bufArray:NodeStruct[] = [];
  const results:NodeStruct = {
    type: 'root',
    children: [],
  };
  HTMLParser(html, {
    start: function(tag:string, attrs: any, unary: boolean) {
      // type for this element
      const type:NodeStruct = {
        type: 'element',
        tag: tag,
      };

      if (attrs.length !== 0) {
        type.attr = attrs.reduce(function(pre:any, attr:any) {
          const name = attr.name;
          const value = attr.value;

          // has multi attibutes
          // make it array of attribute

          //Crucial Change
          // 微信小程序的属性里面可以有变量及代码，可以有空格
          // if (value.match(/ /)) {
          //   value = value.split(' ');
          // }

          // if attr already exists
          // merge it
          if (pre[name]) {
            if (Array.isArray(pre[name])) {
              // already array, push to last
              pre[name].push(value);
            } else {
              // single value, make it array
              pre[name] = [pre[name], value];
            }
          } else {
            // not exist, put it
            pre[name] = value;
          }

          return pre;
        }, {});
      }
      if (unary) {
        // if this tag dosen't have end tag
        // like <img src="hoge.png"/>
        // add to parents
        const parent = bufArray[0] || results;
        if (parent.children === undefined) {
          parent.children = [];
        }
        parent.children.push(type);
      } else {
        bufArray.unshift(type);
      }
    },
    end: function(tag: string) {
      // merge into parent tag
      const type = bufArray.shift();
      if (type.tag !== tag) console.error('invalid state: mismatch end tag');
      if (bufArray.length === 0) {
        results.children.push(type);
      } else {
        let parent = bufArray[0];
        if (parent.children === undefined) {
          parent.children = [];
        }
        parent.children.push(type);
      }
    },
    chars: function(text: string) {
      const type: NodeStruct = {
        type: 'text',
        text: text,
      };
      if (bufArray.length === 0) {
        //Crucial Change
        if(type.text.replace(/ /g, '').replace(/\r/g, '').replace(/\n/g, '').replace(/\t/g, '') !=='' && type.text!=='')
          results.children.push(type);
      } else {
        const parent = bufArray[0];
        if (parent.children === undefined) {
          parent.children = [];
        }
        //都为空格时不加入节点
        //Crucial Change
        if(type.text.replace(/ /g, '').replace(/\r/g, '').replace(/\n/g, '').replace(/\t/g, '') !=='' && type.text!=='')
          parent.children.push(type);
      }
    },
    comment: function(text: string) {
      const type = {
        type: 'comment',
        text: text,
      };
      const parent = bufArray[0];
      //Crucial Change
      let _parent:NodeStruct = parent || {};
      if (_parent.children === undefined) {
        _parent.children = [];
      }
      _parent.children.push(type);
    },
  });
  return results;
}
