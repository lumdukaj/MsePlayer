var t={d:(e,i)=>{for(var s in i)t.o(i,s)&&!t.o(e,s)&&Object.defineProperty(e,s,{enumerable:!0,get:i[s]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e)},e={};t.d(e,{A:()=>a});const i="Live",s={progressUpdateTime:750,connectionRetries:1/0,errorsBeforeStop:1/0},n={controls:!0};window.vpMsePlayers=window.vpMsePlayers||new Map;const o=t=>{const e=window.vpMsePlayers,i=e.get(t);if(!t)return e.values().next().value;if(i)return i;{const i=new r(t);return e.set(t,i),i}};o.destroy=t=>{const e=window.vpMsePlayers;e.get(t)&&e.delete(t)};class r{constructor(t){if(!t)throw new Error("ElementId is required");this.elementId=t,this.streamUrl=null,this.options=null,this.config=null,this.player=null,this.video=null,this.videoContainer=null,this.channelStatus=null,this.status=null,this.playbackStarted=!1,this.eventListeners=[],this.statusTimeout=null,this.retryPlayTimeout=null,this.visibilityChangeListener=null,this.wasPlayingBeforeHidden=!1}setup(t,e,i){if(!t)throw new Error("StreamUrl is required");this.streamUrl=t,this.options={...s,...e},this.config={...n,...i},this.init()}async init(){const t=document.getElementById(this.elementId);if(t){this.videoContainer=t,this.setupHTMLTemplate();try{await this.initPlayer(),this.setInitialState(),this.addEventListeners()}catch(t){console.error("Initialization failed:",t),this.nonLiveStatus()}}else console.error(`Element with id "${this.elementId}" not found.`)}async initPlayer(){try{window.msePlayer?this.player=new window.msePlayer(this.video,this.streamUrl,this.options):await this.loadMsePlayerLibrary()}catch(t){console.error("Error initializing vpMsePlayer:",t),this.nonLiveStatus()}}loadMsePlayerLibrary(){return window.msePlayer?Promise.resolve():new Promise(((t,e)=>{const i=document.createElement("script");i.src="https://vpplayer-assets.eu-1.cdn77-storage.com/mse-player/msePlayer.js",i.onload=()=>{window.msePlayer?(this.player=new window.msePlayer(this.video,this.streamUrl,this.options),t()):e(new Error("msePlayer loaded but not available on window"))},i.onerror=()=>{e(new Error("Failed to load msePlayer library"))},document.head.appendChild(i)}))}async setInitialState(){this.video.muted=!0,this.video.controls=this.config.controls??!0,this.playbackStarted=!1,this.nonLiveStatus(),this.play()}setupHTMLTemplate(){this.videoContainer.classList.add("vp-mse-player-container"),this.videoContainer.innerHTML='\n\t\t<div class="vp-mse-channel-status"></div>\n\t\t<video class="vp-mse-video"></video>\n\t\t',this.video=this.videoContainer.querySelector("video"),this.channelStatus=this.videoContainer.querySelector(".vp-mse-channel-status"),this.setSize(),this.setStyle()}setSize(){if(void 0===this.config.size)return this.videoContainer.style.width="100%",void(this.videoContainer.style.paddingTop="56.25%");const{width:t="100%",height:e="100%"}=this.config.size;this.videoContainer.style.width="number"==typeof t?`${t}px`:t,this.videoContainer.style.height="number"==typeof e?`${e}px`:e}setStyle(){Object.assign(this.videoContainer.style,{position:"relative",overflow:"hidden",backgroundColor:"#000",width:"100%",height:"100%"}),Object.assign(this.video.style,{position:"absolute",width:"100%",height:"100%",top:"0",left:"0",border:"none"}),Object.assign(this.channelStatus.style,{position:"absolute",top:"10px",right:"10px",zIndex:"9999",padding:"3px 6px",borderRadius:"4px",backgroundColor:"#ffffff8e",fontFamily:"Arial, sans-serif",fontSize:"12px",fontWeight:"bold"})}handleVisibilityChange(){this.player&&this.video&&(document.hidden||this.playbackStarted&&this.wasPlayingBeforeHidden&&this.video.paused&&setTimeout((()=>{this.video.play()}),100),this.wasPlayingBeforeHidden=!this.video.paused)}addEventListeners(){this.player.onProgress=this.onProgress.bind(this),this.video.onerror=this.onError.bind(this),this.video.onwaiting=this.onWaiting.bind(this),this.video.onprogress=this.onVideoProgress.bind(this),this.video.onplaying=this.onPlaying.bind(this),this.video.onpause=this.onPause.bind(this),this.visibilityChangeListener=this.handleVisibilityChange.bind(this),document.addEventListener("visibilitychange",this.visibilityChangeListener)}onPlaying(){this.wasPlayingBeforeHidden=!0,clearTimeout(this.statusTimeout),this.statusTimeout=null,clearTimeout(this.retryPlayTimeout),this.retryPlayTimeout=null}onPause(){}onProgress(t){this.playbackStarted||this.onStart(),this.fire("progress",t),this.retryPlayTimeout=clearTimeout(this.retryPlayTimeout),this.retryPlayTimeout=null}onVideoProgress(){this.playbackStarted&&this.status!==i&&this.liveStatus()}onStart(){this.playbackStarted=!0}onWaiting(){this.statusTimeout=clearTimeout(this.statusTimeout),this.statusTimeout=null,this.statusTimeout=setTimeout((()=>{this.nonLiveStatus()}),1500)}onError(t){console.warn("Video error:",t)}liveStatus(){const t=i;this.status!==t&&(this.status=t,this.channelStatus.innerHTML=t,this.channelStatus.style.backgroundColor="#ffffff8e",this.channelStatus.style.color="#ff0000",this.fire(`channel${t}`,{message:`Channel is ${t}`}))}nonLiveStatus(){const t=this.playbackStarted?"Offline":"Connecting";this.status!==t&&(this.status=t,this.channelStatus.innerHTML=t,this.channelStatus.style.backgroundColor="#0000008e",this.channelStatus.style.color="#ffffff",this.fire(`channel${t}`,{message:`Channel is ${t}`}))}fire(t,e,i={}){const s=new CustomEvent(t,{detail:e,bubbles:i.bubbles||!0,cancelable:i.cancelable||!0});this.videoContainer.dispatchEvent(s)}on(t,e,i={}){this.videoContainer.addEventListener(t,e,i),this.eventListeners=this.eventListeners||[],this.eventListeners.push({eventName:t,callback:e,options:i})}off(t,e){this.videoContainer.removeEventListener(t,e)}removeEventListeners(){this.eventListeners&&this.eventListeners.forEach((({eventName:t,callback:e,options:i})=>{this.videoContainer.removeEventListener(t,e,i)})),this.player&&(this.player.onProgress=null),this.video&&(this.video.onerror=null,this.video.onwaiting=null,this.video.onprogress=null,this.video.onplaying=null,this.video.onpause=null),this.visibilityChangeListener&&(document.removeEventListener("visibilitychange",this.visibilityChangeListener),this.visibilityChangeListener=null)}clearResiduals(){this.retryPlayTimeout=clearTimeout(this.retryPlayTimeout),this.retryPlayTimeout=null,this.statusTimeout=clearTimeout(this.statusTimeout),this.statusTimeout=null}play(){this.player&&(this.retryPlayTimeout=clearTimeout(this.retryPlayTimeout),this.retryPlayTimeout=null,this.initRetryPlayTimeout(),this.player.play()?.catch((t=>{this.video&&(this.video.pause(),this.initRetryPlayTimeout())})))}pause(){this.player&&this.player.pause()}stop(){this.player&&this.player.stop()}restart(){console.warn("Restarting player...");const t=this.elementId,e=this.streamUrl,i=this.options,s=this.config;this.destroy(),o(t).setup(e,i,s)}destroyWsWorker(){this.player&&(this.stop(),this.player.ws&&this.player.ws.destroy())}initRetryPlayTimeout(){this.player&&(this.retryPlayTimeout=clearTimeout(this.retryPlayTimeout),this.retryPlayTimeout=null,this.retryPlayTimeout=setTimeout((()=>{this.restart()}),8e3))}destroy(){this.removeEventListeners(),this.clearResiduals(),this.videoContainer.classList.remove("vp-mse-player-container"),this.videoContainer.innerHTML="",this.video.src="",this.video=null,this.channelStatus=null,this.status=null,this.player&&(this.destroyWsWorker(),this.player=null),o.destroy(this.elementId)}}window.vpMsePlayer=o;const a=o;var l=e.A;export{l as default};