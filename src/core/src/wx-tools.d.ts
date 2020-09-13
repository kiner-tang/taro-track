/// <reference types="types" />
export declare function getWechatReferrer(): string;
export declare function getCurrentHref(): string;
export declare function getWeChatNetwork(): Promise<string>;
export declare function getWxSystemInfo(): {
    osInfo: () => string;
    wechatInfo: () => string;
    langInfo: () => string;
    originalOs: WechatMiniprogram.GetSystemInfoSyncResult;
};
export declare function storage(key: string, val?: any): any;
export declare namespace storage {
    var remove: (key: string) => void;
}
export declare function getFileSystemManager(): WechatMiniprogram.FileSystemManager;
