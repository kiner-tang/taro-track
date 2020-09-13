import { sessionStorage, storage, guid } from "@kiner/taro-track-corejs";

export class Constant {
  private session: string = "sid";
  private guid: string = "guid";
  private domain: string;
  private path: string;

  public constructor() {

  }

  public getSessionID(): string {
    let session: string = sessionStorage(this.session);

    if (!session) {
      session = guid();
      // 过期时间为当前session周期
      sessionStorage(this.session, session);
    }

    return session;
  }

  public getDistinctID(): string {
    let juid: string = storage(this.guid);

    if (!juid) {
      juid = guid();
      // 设置为永不过期
      storage(this.guid, juid);
    }

    return juid;
  }

}
