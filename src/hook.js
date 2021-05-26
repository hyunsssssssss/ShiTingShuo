import { user_config } from './config'
let uploadToken, recordDetail;

export function initHook() {
    // Hook 播放器
    let ori_create_player = unsafeWindow['Aliplayer'];
    Object.defineProperty(unsafeWindow, 'Aliplayer', {
        set: (v) => {
            ori_create_player = v;
        },
        get: () => {
            return function(config) {
                unsafeWindow['yunPlayer'] = ori_create_player(config);
                console.log('[Yun]', 'getPlayer:', unsafeWindow['yunPlayer']);
                return unsafeWindow['yunPlayer'];
            };
        }
    });

    // Hook Chivox
    let ori_chivox = {
        get AiPanel() {
            return this.$AiPanel;
        },
        get AiRecorder() {
            return this.$AiRecorder;
        },
        set AiPanel(n) {
            this.$AiPanel = class myAiPanel extends n {
                constructor(config) {
                    let ret = super(config);
                    console.log('[Yun]', 'init AiPanel:', config, ret);
                    return ret;
                }
            };
        },
        set AiRecorder(n) {
            this.$AiRecorder = class myAiRecorder extends n {
                constructor(config) {
                    let ret = super(config);
                    console.log('[Yun]', 'init AiRecorder:', config, ret);
                    unsafeWindow['yunAiRecorder'] = ret;
                    return ret;
                }
            };
        }
    };
    Object.defineProperty(unsafeWindow, 'chivox', {
        get: () => {
            return ori_chivox;
        }
    });

    // Hook HTTP Request
    let ori_xmlHttpReq = unsafeWindow['XMLHttpRequest'];
    class myXMLHttpRequest extends ori_xmlHttpReq{
        get addEventListener() {
            return (type, listener, ...arg)=>{
                if(type==='load' || type==='readystatechange') {
                    let ori_listener = listener;
                    listener = (event)=>{
                        if(this.readyState !== ori_xmlHttpReq.DONE || this.status !== 200) {
                            ori_listener.call(this, event);
                            return;
                        }
                        if(this.uri.startsWith('/tsenglish/resource/getUploadToken')) {
                            let data = JSON.parse(this.responseText);
                            uploadToken = data['object']['token'];
                            console.success('uploadToken:', uploadToken);
                        }
                        if(this.uri.startsWith('/tsenglish/exercise/recordDetail')) {
                            let data = JSON.parse(this.responseText);
                            recordDetail = data?.object?.exercise;
                            console.success('Record Detail:', recordDetail);
                        }
                        if(this.uri) console.log('[Yun]', 'HTTP 200:', this.uri);
                        ori_listener.call(this, event);
                    }
                }
                return super.addEventListener(type, listener, ...arg)
            };
        }

        open(method, url, async, username, password) {
            // console.log('hook-> ', url, async);
            const uri_reg = /^(\/[a-zA-Z0-9].*$)/.exec(url);
            const uri_host_reg = /tsinghuaelt.com(\/.*$)/.exec(url);
            this.uri = uri_reg? uri_reg[1] : uri_host_reg? uri_host_reg[1]: '';
            if(async===undefined) async = true;
            return super.open(method, url, async, username, password);
        };
    
        send(body) {
            if(this.uri.startsWith('/tsenglish/exercise/submit')){
                let data = JSON.parse(body);
                console.success('Submit:', data);
                return super.send(JSON.stringify(data));
            }
    
            return super.send(body);
        };
    
    }
    
    Object.defineProperty(unsafeWindow, 'XMLHttpRequest', {
        set: (v) => { ori_xmlHttpReq = v; },
        get: () => { return myXMLHttpRequest; }
    });

    // Hook Websocket
    let ori_webSocket = unsafeWindow['WebSocket'];
    class myWebSocket extends ori_webSocket{
        set onmessage(n) {
            super.onmessage = n;
        }
        get addEventListener() {
            return (type, listener, ...arg)=>{
                console.log('[Yun]', 'WebSocket addEventListener:', type, listener);
                if(this.url.startsWith('wss://cloud.chivox.com/en.sent.score') && type==='message') {
                    let ori_listener = listener;
                    listener = (event)=>{
                        let data = JSON.parse(event.data);
                        console.log('[Yun]', 'WebSocket Recv:', this.url, data);
                        // Object.defineProperty(event, 'data', {get(){return JSON.stringify(data);}})
                        ori_listener(event);
                    }
                }
                return super.addEventListener(type, listener, ...arg)
            };
        }
        send(data) {
            if(typeof data == 'object' && user_config.autorecord) { // 发送语音
                if(!this.doing_topic) return;
                $.ajax({
                    url: `https://open.izhixue.cn/resource/web/url`,
                    type: "get",
                    async: false,
                    data: {
                        token: uploadToken,
                        resourceId: this.doing_topic.audio
                    },
                    success: (response)=> {
                        const onload = (e)=> {
                            if(!e.status && e.target) e=e.target;
                            if (e.status == 200) {
                                for (let i = 0; i < e.response.byteLength; i+=3840)
                                    super.send(e.response.slice(i, i+3840));
                                
                                super.send(new ArrayBuffer(0));
                                console.success('发送标准答案成功！');
                            } else {
                                console.error('[Yun]', 'Wtf?', e);
                            }
                        };
                        const error = (err)=> {
                            console.error('[Yun]', 'get Audio Fail', err);
                            super.send(new ArrayBuffer(0));
                        };
                        const fallback = (err)=> {
                            console.error('尝试使用 GM_xmlhttpRequest 失败:', err);
                            var xhr = new XMLHttpRequest();
                            xhr.open('GET', response.data.PlayAuth, true);
                            xhr.withCredentials = false;
                            xhr.responseType = 'arraybuffer';
                            xhr.onerror = error;
                            xhr.onload = onload;
                            xhr.send();
                        }
                        try {
                            window.GM_xmlhttpRequest({
                                method: 'GET',
                                url: response.data.PlayAuth,
                                onload: onload,
                                onerror: fallback,
                                onabort: fallback,
                                responseType: 'arraybuffer'
                            });
                        } catch (err) {
                            fallback(err);
                        }
                    },
                    error: (err)=> {
                        console.error('[Yun]', 'get Audio Info Fail', err);
                    }
                });
                this.doing_topic = undefined;
                return;
            }
            if(typeof data == 'string') {
                let json = JSON.parse(data);
                if('request' in json && json.request.refText) {
                    if(user_config.autorecord) json.audio.audioType = 'mp3';
                    for (const item of recordDetail.sentItems) {
                        if(item.text.replace(/[ \\.!,'\\?]/g, '').toLowerCase() == json.request.refText.replace(/[ \\.!,'\\?]/g, '').toLowerCase()) {
                            this.doing_topic = item;
                            console.success('Doing Topic:', item);
                            break;
                        }
                    }
                    if(!this.doing_topic) console.error('[Yun]', 'Buggggg here~ Please open a issue on gayhub and paste:', json);
                }
                data = JSON.stringify(json);
            }
            console.log('[Yun]', 'WebSocket Send:', this.url, data);
            return super.send(data);
        }
    }

    Object.defineProperty(unsafeWindow, 'WebSocket', {
        set: (v) => { ori_webSocket = v; },
        get: () => { return myWebSocket; }
    });
}