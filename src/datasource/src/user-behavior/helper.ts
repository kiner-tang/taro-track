/**
 * 获取页面元素信息
 * @param {String} element 元素class或者id
 * @returns {Promise}
 */

interface BoundingClientRect {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
  x: number
  y: number
  dataset: any
}

interface ScrollOffset {
  scrollTop: number
  scrollBottom: number
  scrollLeft: number
  scrollRight: number
}

interface ElementInfo {
  boundingClientRect: BoundingClientRect[]
  scrollOffset: ScrollOffset
}
export const getBoundingClientRect = function (element: string): Promise<ElementInfo> {
  return new Promise((reslove) => {
    const query = wx.createSelectorQuery();
    query.selectAll(element).boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(res => reslove({ boundingClientRect: res[0], scrollOffset: res[1] }));
  });
};
/**
 * 判断点击是否落在目标元素
 * @param {Object} clickInfo 用户点击坐标
 * @param {Object} boundingClientRect 目标元素信息
 * @param {Object} scrollOffset 页面位置信息
 * @returns {Boolean}
 */
interface ClickInfo {
  detail: {
    x: number
    y: number
  }
}

/**
 * 判断目标元素是否被点中
 * @param clickInfo
 * @param boundingClientRect
 * @param scrollOffset
 */
export const isClickTrackArea = function (clickInfo: ClickInfo, boundingClientRect: BoundingClientRect, scrollOffset: ScrollOffset): boolean {
  if (!boundingClientRect) return false;
  const { x, y } = clickInfo.detail; // 点击的x y坐标
  const { left, right, top, height } = boundingClientRect;
  const { scrollTop } = scrollOffset;
  return left < x && x < right && scrollTop + top < y && y < scrollTop + top + height;

};

/**
 * 获取当前页面
 * @returns {Object} 当前页面Page对象
 */
export const getActivePage = function (): any {
  const curPages = getCurrentPages();
  if (curPages.length) {
    return curPages[curPages.length - 1];
  }
  return {};
};

/**
 * 获取前一页面
 * @returns {Object} 当前页面Page对象
 */
export const getPrevPage = function () {
  const curPages = getCurrentPages();
  if (curPages.length > 1) {
    return curPages[curPages.length - 2];
  }
  return {};
};

export const _isPromise = function (value: any) {
  return value && Object.prototype.toString.call(value) === '[object Promise]';
};
