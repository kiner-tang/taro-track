import Taro, { Component, Config } from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import "./index.scss";

export default class Index extends Component {
  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    navigationBarTitleText: "首页"
  };

  render() {
    const arr = new Array(10);
    return (
      <View className="index" id="main-container">
        <View className="title">dolphin-wx</View>
        <Image src="https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2724409193,2018760642&fm=26&gp=0.jpg1" />
        <Image
          className="pic2"
          onError={() => console.log("图片加载失败")}
          onClick={() => console.log("点击了图片")}
          src="https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2724409193,2018760642&fm=26&gp=0.jpg1"
        />
        <Image
          id="pic"
          src="https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2724409193,2018760642&fm=26&gp=0.jpg"
        />
        <Image
          onLoad={() => {
            console.log("加载成功");
          }}
          src="https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2724409193,2018760642&fm=26&gp=0.jpg"
        />
        <Image src="https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2724409193,2018760642&fm=26&gp=0.jpg" />
        <View
          className="btn"
          id="btn"
          onClick={() => Taro.navigateTo({ url: "/pages/detail/detail" })}
        >
          跳转页面
        </View>

        <View className="root">
          <View className="row">
            {arr.map((_item, index) => (
              <View className="col" key={index}>
                这是文本 这是文本 这是文本 这是文本
                {index}
              </View>
            ))}
          </View>
        </View>
        <Text className="container">这个文本</Text>
      </View>
    );
  }
}
