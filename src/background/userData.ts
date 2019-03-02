import {
  EConfigKey,
  UserInfo,
  Site,
  Dictionary,
  EUserDataRange
} from "@/interface/common";
import localStorage from "@/service/localStorage";
import PTPlugin from "./service";

export class UserData {
  public items: Dictionary<any> | null = null;
  public storage: localStorage = new localStorage();
  public configKey: string = EConfigKey.userDatas;

  constructor(public service: PTPlugin) {
    this.load();
  }

  /**
   * 获取记录
   */
  public load(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.storage.get(this.configKey, (result: any) => {
        console.log("UserData.load", result);
        this.items = result || {};
        resolve(this.items);
      });
    });
  }

  /**
   * 获取指定站点的数据
   * @param host
   * @param range
   */
  public get(host: string, range: EUserDataRange = EUserDataRange.latest) {
    if (!this.items) {
      return null;
    }
    let datas: Dictionary<any> = this.items[host];
    if (!datas) {
      return null;
    }
    switch (range) {
      case EUserDataRange.all:
        return datas;
      case EUserDataRange.today:
        let key = this.getKeyForToDay();
        return datas[key];
    }

    return datas[EUserDataRange.latest];
  }

  /**
   * 更新用户数据
   * @param site 站点信息
   * @param data 用户数据
   */
  public update(site: Site, data: UserInfo) {
    let host = site.host;
    if (!host) {
      return;
    }
    let saveData: UserInfo = Object.assign({}, data);
    if (this.items == null) {
      this.load().then(() => {
        this.update(site, data);
      });
    } else {
      let siteData = this.items[host];
      let key = this.getKeyForToDay();
      if (!siteData) {
        siteData = {};
      }

      siteData[key] = saveData;
      siteData[EUserDataRange.latest] = saveData;

      this.items[host] = siteData;

      this.storage.set(this.configKey, this.items);
      this.service.saveUserData();
    }
  }

  /**
   * 清除记录
   */
  public clear(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.items = {};
      this.storage.set(this.configKey, this.items);
      this.service.saveUserData();
      resolve(this.items);
    });
  }

  /**
   * 获取当天日期的键值
   */
  getKeyForToDay(): string {
    let day = new Date();
    let yyyy = day.getFullYear();
    let m = day.getMonth() + 1;
    let mm = m < 10 ? "0" + m : m;

    let d = day.getDate();
    let dd = d < 10 ? "0" + d : d;

    return `${yyyy}${mm}${dd}`;
  }
}
