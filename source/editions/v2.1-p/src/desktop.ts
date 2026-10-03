type Bridge={postMessage(message:Record<string,unknown>):void};
export function nativeBridge():Bridge|undefined{return (window as Window & {chrome?:{webview?:Bridge}}).chrome?.webview;}
