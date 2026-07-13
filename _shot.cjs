const { chromium } = require(process.env.NODE_PATH + '/playwright');
const SC='/tmp/claude-0/-home-user-random-website/c7815fd1-41c3-538c-a7b2-1e5297312d23/scratchpad';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1280,height:520},deviceScaleFactor:2});
await p.goto('http://localhost:8099/',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
await p.screenshot({path:SC+'/witty-hero.png'});
await b.close();})();
