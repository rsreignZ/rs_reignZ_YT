/* Public website experiment. Official IFrame API, no uploads or YouTube extraction.
 * Served locally and published as youtube-test.js. No playback without user action.
 */
(()=>{
 const $=id=>document.getElementById(id);if(!$('yt-test-form'))return;
 let player,readyPromise,start=5,length=20,ended=false,generation=0;
 function videoId(value){if(/^[\w-]{11}$/.test(value))return value;let u;try{u=new URL(value)}catch{return null}if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(u.hostname))return null;const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{11})/)?.[1];return /^[\w-]{11}$/.test(id||'')?id:null}
 function api(){if(window.YT?.Player)return Promise.resolve();if(readyPromise)return readyPromise;readyPromise=new Promise((resolve,reject)=>{const old=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{old?.();resolve()};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>reject(Error('YouTube player could not load.'));document.head.append(script);setTimeout(()=>{if(!window.YT?.Player)reject(Error('YouTube player timed out. Check your connection.'))},15000)}).catch(e=>{readyPromise=null;throw e});return readyPromise}
 $('yt-test-form').onsubmit=async e=>{
  e.preventDefault();const id=videoId($('yt-test-video').value.trim()),nextStart=Number($('yt-test-start').value),nextLength=Number($('yt-test-length').value);
  if(!id||!Number.isFinite(nextStart)||nextStart<0||nextStart>86400||!Number.isFinite(nextLength)||nextLength<1||nextLength>300){$('yt-test-status').textContent='Enter a YouTube video URL, a valid start, and a clip length from 1 to 300 seconds.';return}
  const current=++generation;player?.pauseVideo?.();$('yt-test-status').textContent='Loading YouTube player…';
  try{await api();if(current!==generation)return;player?.destroy();start=nextStart;length=nextLength;ended=false;$('yt-test-frame').hidden=false;$('yt-test-frame').replaceChildren(Object.assign(document.createElement('div'),{id:'yt-test-player'}));$('yt-test-controls').hidden=true;
   player=new YT.Player('yt-test-player',{width:'100%',height:'100%',host:'https://www.youtube.com',videoId:id,playerVars:{playsinline:1,controls:1,origin:location.origin},events:{
    onReady:()=>{if(current!==generation)return;player.cueVideoById({videoId:id,startSeconds:start,endSeconds:start+length});$('yt-test-seek').max=length;$('yt-test-seek').value=0;$('yt-test-clock').textContent='0 / '+length+' s';$('yt-test-controls').hidden=false;$('yt-test-status').textContent='Ready — press Play to test this clip.'},
    onStateChange:e=>{if(current!==generation)return;if(e.data===0)ended=true;const duration=player.getDuration();if(duration>0&&duration<=start){player.pauseVideo();$('yt-test-controls').hidden=true;$('yt-test-status').textContent='Start time is beyond this video. Choose an earlier start.'}else if(duration>0&&start+length>duration){length=duration-start;$('yt-test-seek').max=length;$('yt-test-status').textContent='Clip shortened to the remaining video duration.'}},
    onError:e=>{if(current!==generation)return;$('yt-test-status').textContent='YouTube could not play this video (code '+e.data+'). Try another embeddable video.';$('yt-test-controls').hidden=true;}
   }});
  }catch(error){$('yt-test-status').textContent=error.message}
 };
 $('yt-test-seek').oninput=()=>{if(!player?.seekTo)return;ended=false;player.seekTo(start+Math.max(0,Math.min(length,Number($('yt-test-seek').value))),true)};
 $('yt-test-play').onclick=()=>{if(!player?.getPlayerState)return;if(player.getPlayerState()===1)player.pauseVideo();else{if(ended||player.getCurrentTime()<start||player.getCurrentTime()>=start+length){player.seekTo(start,true);ended=false}player.playVideo()}};
 $('yt-test-restart').onclick=()=>{if(player?.seekTo){ended=false;player.seekTo(start,true);player.playVideo()}};
 setInterval(()=>{if(!player?.getCurrentTime||$('yt-test-controls').hidden)return;const t=player.getCurrentTime();if(t>=start+length){player.pauseVideo();ended=true}else if(player.getPlayerState()===1&&t<start-.5)player.seekTo(start,true);const relative=Math.max(0,Math.min(length,t-start));if(document.activeElement!==$('yt-test-seek'))$('yt-test-seek').value=relative;$('yt-test-clock').textContent=relative.toFixed(1)+' / '+Number(length.toFixed(1))+' s'},200);
})();
