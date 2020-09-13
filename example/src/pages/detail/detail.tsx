import Taro, {
  Component,
  Config,
  downloadFile,
  uploadFile,
  request
} from "@tarojs/taro";
import { View, Image, Input } from "@tarojs/components";

import "./index.scss";


export default class Detail extends Component {


  constructor(props) {
    super(props);
  }

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

  private async download() {
    const res = await downloadFile({
      url: `http://test.xxx.com/8952575a0dd1d8b07f089471876763400da7148e.png`
    });
    console.log("download返回结果：", res);
  }
  private async upload() {
    const res = await uploadFile({
      url:
        "http://test.xxx.com/hippo/8952575a0dd1d8b07f089471876763400da7148e.png",
      filePath: "/banner",
      name: "testBanner"
    });
    console.log("upload返回结果：", res);
  }

  private async request() {
    const res = await request({
      url: `https://xxx.bs2cdn.test.com/fe/xxx.json?_=${Date.now()}`
    });
    console.log("request返回结果：", res);
  }

  render() {
    return (
      <View className="index">
        <View className="title">这是详情页</View>

        <Input
          name="userName"
          placeholder="绑定了事件的输入框"
          onInput={() => console.log("用户定义事件：用户输入了")}
          onFocus={() => console.log("用户定义事件：文本框聚焦了")}
          onBlur={() => console.log("用户定义事件：用户失去焦点")}
          onConfirm={() => console.log("用户定义事件：用户确认了输入")}
        />
        <Input placeholder="没绑定了事件的输入框" />

        <Image src="https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2724409193,2018760642&fm=26&gp=0.jpg" />
        <View className="btn" onClick={() => this.request()}>
          请求接口
        </View>
        <View className="btn" onClick={() => this.download()}>
          下载文件
        </View>
        <View className="btn" onClick={this.upload}>
          上传文件
        </View>
      </View>
    );
  }
}
