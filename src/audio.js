// Original procedural soundscape. No downloads, microphone or third-party samples.
export function createSoundscape(){
 let ctx,master,limiter,meter,meterData,recordBus,music,noise,enabled=false,active=false,nextNote=0,beat=0,lastBird=0,depositStep=0,effects=0,voices=0,peakVoices=0,dropped=0;
 const lastEffects=new Map(),spacing={step:.09,chop:.075,pick:.10,drop:.10,delivery:.16,coin:.14,build:.3,hit:.055,sweep:.20,grunt:2.8};
 function takeVoice(){if(voices>=32){dropped++;return false;}voices++;peakVoices=Math.max(peakVoices,voices);return true;}
 const notes=[62,69,74,76,74,69,67,69,60,67,72,74,72,67,65,67,58,65,70,72,70,65,62,65,60,67,72,69,67,65,62,60];
 const hz=midi=>440*2**((midi-69)/12);
 function boot(){
  if(ctx)return true;
  try{
   const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return false;ctx=new Context();
   master=ctx.createGain();master.gain.value=0;limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=4;meter=ctx.createAnalyser();meter.fftSize=512;meterData=new Float32Array(512);master.connect(limiter).connect(meter).connect(ctx.destination);
   music=ctx.createGain();music.gain.value=.30;music.connect(master);
   noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   return true;
  }catch{ctx=null;return false;}
 }
 function envelope(node,duration,volume,when,bus=master,attack=.008){const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),when+attack);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);node.connect(gain).connect(bus);node.start(when);node.stop(when+duration+.02);node.onended=()=>{voices--;node.disconnect();gain.disconnect();};}
 function tone(frequency,duration,volume,when=ctx.currentTime,type='sine',end=frequency,bus=master){if(!takeVoice())return;const osc=ctx.createOscillator();osc.type=type;osc.frequency.setValueAtTime(frequency,when);osc.frequency.exponentialRampToValueAtTime(Math.max(1,end),when+duration);envelope(osc,duration,volume,when,bus);}
 function rustle(duration,volume,frequency=1200,type='lowpass',when=ctx.currentTime){if(!takeVoice())return;const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=noise;source.playbackRate.value=.85+Math.random()*.3;source.connect(filter);filter.type=type;filter.frequency.value=frequency;filter.Q.value=.7;const gain=ctx.createGain();gain.gain.setValueAtTime(Math.max(.0001,volume),when);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);filter.connect(gain).connect(master);source.start(when,Math.random());source.stop(when+duration);source.onended=()=>{voices--;source.disconnect();filter.disconnect();gain.disconnect();};}
 function grunt(volume=.022){
  // ponytail: formant synthesis suggests effort; replace with recorded performances for expressive voices.
  if(!takeVoice())return;const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;osc.type='sawtooth';osc.frequency.setValueAtTime(115+Math.random()*15,now);osc.frequency.exponentialRampToValueAtTime(82,now+.19);
  const filters=[520,1050].map(frequency=>{const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=5;osc.connect(filter).connect(gain);return filter;});osc.onended=()=>{voices--;osc.disconnect();filters.forEach(filter=>filter.disconnect());gain.disconnect();};
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.035);gain.gain.exponentialRampToValueAtTime(.0001,now+.2);gain.connect(master);osc.start();osc.stop(now+.21);
 }
 function sync(){if(!ctx)return;if(enabled&&active){ctx.resume().catch(()=>{});master.gain.setTargetAtTime(.72,ctx.currentTime,.045);if(nextNote<=ctx.currentTime)nextNote=ctx.currentTime+.1;}else{master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(0,ctx.currentTime);ctx.suspend().catch(()=>{});}}
 return {
  setEnabled(value){enabled=!!value;if(enabled&&!boot()){enabled=false;return false;}sync();return true;},
  setActive(value){if(active===!!value)return;active=!!value;sync();},
  effect(kind,volume=1){
   if(!enabled||!active||!ctx||ctx.state!=='running')return;const now=ctx.currentTime;if(now-(lastEffects.get(kind)??-Infinity)<(spacing[kind]||0))return;lastEffects.set(kind,now);effects++;
   if(kind==='step'){rustle(.11,.045*volume,850);tone(95,.065,.016*volume,now,'sine',55);}
   else if(kind==='chop'){rustle(.13,.14*volume,1700);tone(190,.14,.075*volume,now,'triangle',75);tone(650,.045,.025*volume,now,'sine',220);}
   else if(kind==='pick'){rustle(.17,.075*volume,2400,'highpass');tone(580,.075,.022*volume,now,'sine',790);}
   else if(kind==='grunt')grunt(.025*volume);
   else if(kind==='drop'){if(now-(lastEffects.get('deposit-run')??-Infinity)>.45)depositStep=0;lastEffects.set('deposit-run',now);rustle(.07,.045*volume,1300);tone([262,330,392,523,659][depositStep++%5],.12,.026*volume,now,'triangle');}
   else if(kind==='coin'){tone(1047,.11,.023*volume,now);tone(1568,.14,.016*volume,now+.055);}
   else if(kind==='gather'||kind==='delivery'){[kind==='delivery'?70:74,kind==='delivery'?77:78].forEach((note,i)=>tone(hz(note),.23,.027*volume,now+i*.075));}
   else if(kind==='build'){rustle(.35,.06,800);[62,66,69,74,78].forEach((note,i)=>tone(hz(note),.36,.045*volume,now+i*.06,'triangle'));}
   else if(kind==='sweep')rustle(.18,.038*volume,1800,'bandpass');
   else if(kind==='bow'){rustle(.055,.07*volume,3200,'highpass');tone(220,.10,.027*volume,now,'triangle',90);}
   else if(kind==='spear'){rustle(.12,.045*volume,2100,'bandpass');}
   else if(kind==='sword'){rustle(.09,.05*volume,2800,'highpass');tone(950,.065,.014*volume,now,'sine',420);}
   else if(kind==='hit'){rustle(.08,.085*volume,1500);tone(135,.12,.05*volume,now,'triangle',65);tone(820,.04,.02*volume,now,'triangle',350);}
   else if(kind==='howl'){tone(300,.8,.025*volume,now,'triangle',450);tone(600,.8,.009*volume,now,'sine',900);}
   else if(kind==='ui')tone(660,.075,.018,now,'sine',880);
  },
  captureStream(){if(!ctx||!enabled)return null;if(!recordBus){recordBus=ctx.createMediaStreamDestination();limiter.connect(recordBus);}return recordBus.stream;},
  get status(){let sum=0,peak=0;if(meter){meter.getFloatTimeDomainData(meterData);for(const v of meterData){sum+=v*v;peak=Math.max(peak,Math.abs(v));}}return {enabled,active,state:ctx?.state||'uninitialized',effects,musicBeat:beat,voices,peakVoices,dropped,rms:Math.sqrt(sum/512),peak};},
  tick(){
   if(!enabled||!active||!ctx||ctx.state!=='running')return;const now=ctx.currentTime;
   if(nextNote<now-.3)nextNote=now+.05;
   while(nextNote<now+1.2){const note=notes[beat%notes.length];tone(hz(note),.68,.06,nextNote,'triangle',hz(note),music);tone(hz(note+12),.38,.012,nextNote+.018,'sine',hz(note+12),music);if(beat%8===0){const root=[50,48,46,48][Math.floor(beat/8)%4];[root,root+7,root+12].forEach(n=>tone(hz(n),2.8,.025,nextNote,'sine',hz(n),music));}nextNote+=.38;beat++;}
   if(now-lastBird>11){lastBird=now;[0,.13,.32].forEach((offset,i)=>tone(1700+i*240,.1,.008,now+offset,'sine',2200));}
  }
 };
}
