// 構図が一致する、配置確認用のSVGペア。正式素材とは別名で保存します。
import { writeFile } from 'node:fs/promises';
const destination = new URL('../assets/maps/', import.meta.url);

function scene(awake) {
  const p = awake ? { sky1:'#c8c0df', sky2:'#ecd8d5', land:'#a9b4b0', hill:'#91a7a2', road:'#e3d1ba', purple:'#b095ba', roof:'#c294ad', wood:'#c3a3ac', light:'#ffe6a3', line:'#857d9e', tree:'#8eaaa0' } : { sky1:'#9a96b4', sky2:'#c4b6c7', land:'#a1a5ad', hill:'#8d99a2', road:'#c6bcc0', purple:'#948aab', roof:'#9c879d', wood:'#a89caa', light:'#c7b6c9', line:'#7b7693', tree:'#8d9ca3' };
  let seed = 27;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const trees = Array.from({length:85}, () => {
    const x = 90 + random()*1260, y = 230 + random()*620, s = 12+random()*15;
    if ((x>180&&x<590&&y<510)||(x>850&&x<1260&&y<530)||(x>840&&y>570)) return '';
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><ellipse cy="13" rx="${s*.8}" ry="${s*.35}" fill="#65647c" opacity=".09"/><path d="M0 0v18" stroke="${p.line}" stroke-width="3"/><ellipse cy="-7" rx="${s}" ry="${s*1.2}" fill="${p.tree}"/><ellipse cx="-5" cy="-13" rx="${s*.55}" ry="${s*.7}" fill="#eee4dc" opacity=".14"/></g>`;
  }).join('');
  const bulbs = Array.from({length:18},(_,i)=>{
    const angle = i*Math.PI*2/18;
    const x=1065+Math.sin(angle)*150,y=270+Math.cos(angle)*150;
    return `<circle cx="${x}" cy="${y}" r="${awake?4:2.5}" fill="${p.light}" ${awake?'filter="url(#glow)"':''}/>`;
  }).join('');
  const cabins = Array.from({length:10},(_,i)=>{
    const angle=i*Math.PI*2/10,x=1065+Math.sin(angle)*150,y=270+Math.cos(angle)*150;
    return `<path d="M1065 270 ${x} ${y}" stroke="${p.line}" stroke-width="3"/><g transform="translate(${x} ${y})"><path d="M-13 0v20q13 12 26 0V0" fill="${i%2?p.wood:p.purple}" stroke="${p.line}" stroke-width="2"/><path d="M-16 0h32l-4-7h-24z" fill="${p.roof}"/><path d="M-8 4H8v11H-8z" fill="${p.light}" opacity="${awake?'.9':'.25'}"/></g>`;
  }).join('');
  const stars=Array.from({length:30},()=>{
    const x=random()*1440,y=random()*210,r=random()*2+1;
    return `<path d="m${x} ${y-r*3} ${r} ${r*2} ${r*2} ${r} ${-r*2} ${r} ${-r} ${r*2} ${-r} ${-r*2} ${-r*2} ${-r} ${r*2} ${-r}z" fill="#fff3d7" opacity="${awake?'.8':'.45'}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960" viewBox="0 0 1440 960">
  <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${p.sky1}"/><stop offset="1" stop-color="${p.sky2}"/></linearGradient><linearGradient id="ground" x2="0" y2="1"><stop stop-color="${p.land}"/><stop offset="1" stop-color="${p.hill}"/></linearGradient><radialGradient id="haze"><stop stop-color="#fff1d7" stop-opacity=".3"/><stop offset="1" stop-color="#fff1d7" stop-opacity="0"/></radialGradient><filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="grain" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".6" fill="#f9e9d8" opacity=".13"/></pattern></defs>
  <rect width="1440" height="960" fill="url(#sky)"/>
  <circle cx="714" cy="98" r="32" fill="#f4e5d7" opacity=".65"/><circle cx="727" cy="85" r="29" fill="${p.sky1}"/>
  ${stars}<g fill="#e2d6df" opacity=".27"><ellipse cx="230" cy="121" rx="142" ry="22"/><ellipse cx="1270" cy="153" rx="166" ry="27"/><ellipse cx="565" cy="172" rx="100" ry="17"/></g>
  <path d="M0 265Q110 195 220 245T490 236T780 242T1080 229T1440 252V960H0Z" fill="#888da2" opacity=".28"/>
  <path d="M0 320Q200 210 410 286T850 273T1440 292V960H0Z" fill="${p.hill}" opacity=".6"/>
  <path d="M-40 594Q-10 358 290 291Q621 202 1010 296Q1437 339 1480 624Q1430 891 1020 939Q580 1015 190 864Q-20 785-40 594Z" fill="url(#ground)"/>
  <ellipse cx="760" cy="400" rx="780" ry="410" fill="url(#haze)"/>
  <path d="M-30 748Q196 570 269 637T480 732Q568 754 523 876T730 1000" fill="none" stroke="#c9c3d4" stroke-width="58" opacity=".55"/>
  <path d="M630 995Q584 862 655 760Q711 662 705 570Q699 481 539 430Q455 401 392 370M705 570Q815 422 1048 416M705 570Q856 627 1092 746" fill="none" stroke="${p.road}" stroke-width="60"/>
  <path d="M630 995Q584 862 655 760Q711 662 705 570Q699 481 539 430Q455 401 392 370M705 570Q815 422 1048 416M705 570Q856 627 1092 746" fill="none" stroke="#f1e3d7" stroke-width="2" opacity=".4" stroke-dasharray="3 12"/>
  <g opacity=".6" fill="#b5a4b8"><ellipse cx="146" cy="520" rx="75" ry="30"/><ellipse cx="1245" cy="548" rx="96" ry="32"/><ellipse cx="332" cy="782" rx="71" ry="31"/></g>
  ${trees}
  <g transform="translate(390 345)"><ellipse cy="86" rx="178" ry="52" fill="#706e89" opacity=".15"/><ellipse cy="72" rx="155" ry="43" fill="${p.purple}"/><ellipse cy="62" rx="151" ry="37" fill="${p.wood}" stroke="${p.line}" stroke-width="3"/><path d="M-127-13V60M127-13V60M-65-3v89M65-3v89" stroke="${p.light}" stroke-width="6"/><path d="M0-165V66" stroke="${p.wood}" stroke-width="9"/><path d="M-161-15Q-88-48 0-145Q88-48 161-15Q85 12 0 10Q-85 12-161-15Z" fill="${p.roof}" stroke="${p.line}" stroke-width="3"/><path d="M0-145Q-10-52-55 7M0-145Q10-52 55 7" fill="none" stroke="${p.wood}" stroke-width="27"/><path d="M-160-15Q0 28 160-15V0Q0 41-160 0Z" fill="${p.purple}"/><path d="M0-165v-38l48 10-48 18" fill="${p.roof}" stroke="${p.line}" stroke-width="3"/>
  <g fill="${p.light}" opacity="${awake?'1':'.5'}"><path d="m-98 38 10-16 11 5 18-7 8 13-7 19h-29l-4 12h-7l5-22zm67 16 10-16 11 5 18-7 8 13-7 19h-29l-4 12h-7l5-22zm69-16 10-16 11 5 18-7 8 13-7 19H49l-4 12h-7l5-22z"/></g>
  ${Array.from({length:15},(_,i)=>`<circle cx="${-140+i*20}" cy="${2+12*Math.sin(i/14*Math.PI)}" r="3" fill="${p.light}" ${awake?'filter="url(#glow)"':''}/>`).join('')}</g>
  <g><ellipse cx="1065" cy="470" rx="139" ry="30" fill="#706e89" opacity=".15"/><path d="m1065 270-100 195m100-195 100 195" stroke="${p.wood}" stroke-width="15"/><path d="M966 465h199" stroke="${p.line}" stroke-width="8"/><circle cx="1065" cy="270" r="151" fill="none" stroke="${p.wood}" stroke-width="10"/><circle cx="1065" cy="270" r="137" fill="none" stroke="${p.line}" stroke-width="2"/>${cabins}<circle cx="1065" cy="270" r="14" fill="${p.light}"/>${bulbs}</g>
  <g transform="translate(710 554)"><ellipse cy="33" rx="72" ry="24" fill="#aaa0b5"/><ellipse cy="24" rx="63" ry="21" fill="${p.purple}"/><ellipse cy="19" rx="57" ry="16" fill="#c6c8d4"/><path d="M0 20V-28" stroke="${p.wood}" stroke-width="7"/><ellipse cy="-25" rx="27" ry="9" fill="${p.wood}"/><path d="M0-60v26" stroke="${p.wood}" stroke-width="5"/><circle cy="-62" r="6" fill="${p.light}"/></g>
  <g transform="translate(1090 714)"><ellipse cy="62" rx="211" ry="93" fill="none" stroke="${p.line}" stroke-width="13"/><ellipse cy="62" rx="211" ry="93" fill="none" stroke="${p.wood}" stroke-width="6" stroke-dasharray="3 13"/><path d="M-163 43v-83h92v83" fill="${p.wood}"/><path d="m-180-40 65-50 66 50z" fill="${p.roof}"/><path d="M-144-31h21v33h-21M-111-31h21v33h-21" fill="${p.light}" opacity="${awake?'.8':'.3'}"/><path d="M-184 44h130" stroke="${p.line}" stroke-width="5"/>
  <g transform="translate(8 105) rotate(-6)"><path d="M-104-37h65V6h-65z" fill="${p.purple}"/><path d="M-106-42h68v9h-68" fill="${p.roof}"/><path d="M-93-28h43v17h-43" fill="${p.light}" opacity=".65"/><path d="M-23-30h70v36h-70z" fill="${p.roof}"/><path d="M-19-59h34v29h-34z" fill="${p.wood}"/><path d="M-24-64h44v8h-44M34-30v-24h12v24" fill="${p.purple}"/><path d="M-12-51h19v14h-19" fill="${p.light}"/><path d="M-110 8H57" stroke="${p.line}" stroke-width="6"/><g fill="${p.line}" stroke="${p.wood}" stroke-width="3"><circle cx="-89" cy="12" r="11"/><circle cx="-53" cy="12" r="11"/><circle cx="-5" cy="12" r="14"/><circle cx="36" cy="12" r="11"/></g><path d="M41-66q-37-25-2-39t-5-34" fill="none" stroke="#ede0de" stroke-width="13" opacity=".35"/></g></g>
  <g transform="translate(604 886)"><path d="M-72 48V-51q72-61 144 0v99" fill="none" stroke="${p.wood}" stroke-width="12"/><path d="M-68-48q68-60 136 0" fill="none" stroke="${p.purple}" stroke-width="20"/><path d="M-90 48h35v-84h-35zm145 0h35v-84H55z" fill="${p.purple}"/><path d="m-99-36 26-32 27 32zm145 0 27-32 26 32z" fill="${p.roof}"/><path d="m0-82 4 10 11 4-11 4-4 10-4-10-11-4 11-4z" fill="${p.light}" ${awake?'filter="url(#glow)"':''}/></g>
  <path d="M0 902q122-77 249 19t221 12M809 960q170-89 303-30t328-53" fill="none" stroke="${p.tree}" stroke-width="80"/>
  ${awake?'<g fill="#ffe6a3" filter="url(#glow)"><circle cx="562" cy="579" r="4"/><circle cx="797" cy="736" r="4"/><circle cx="408" cy="548" r="3"/><circle cx="1238" cy="612" r="4"/><circle cx="900" cy="469" r="3"/><circle cx="547" cy="817" r="4"/><circle cx="836" cy="338" r="3"/></g>':''}
  <rect width="1440" height="960" fill="url(#grain)"/>
  </svg>`.replace(/[ \t]+$/gm, '');
}
await Promise.all([writeFile(new URL('placeholder-before.svg', destination), scene(false)), writeFile(new URL('placeholder-after.svg', destination), scene(true))]);
console.log('Created matched placeholder map pair (1440 × 960).');
