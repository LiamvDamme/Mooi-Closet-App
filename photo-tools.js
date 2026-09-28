async function bitmap(src){const image=new Image();image.src=src;await image.decode();return createImageBitmap(image);}
// Browser-only helpers: photos stay on this device until the user saves or requests AI.
export async function photoHash(src){const image=await bitmap(src);const c=document.createElement('canvas');c.width=9;c.height=8;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,9,8);ctx.drawImage(image,0,0,9,8);image.close();const d=ctx.getImageData(0,0,9,8).data;let bits='';for(let y=0;y<8;y++)for(let x=0;x<8;x++){const a=(y*9+x)*4,b=a+4;bits+=(d[a]+d[a+1]+d[a+2])>(d[b]+d[b+1]+d[b+2])?'1':'0';}return bits;}
export function similarHash(a,b){return /^[01]{64}$/.test(a||'')&&/^[01]{64}$/.test(b||'')&&[...a].filter((v,i)=>v!==b[i]).length<=4;}
export async function cleanPlainBackground(src){const image=await bitmap(src);const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);image.close();const frame=ctx.getImageData(0,0,c.width,c.height);removeBackgroundPixels(frame);ctx.putImageData(frame,0,0);return c.toDataURL('image/png');}
export function removeBackgroundPixels(frame){const d=frame.data,w=frame.width,h=frame.height;
 const corners=[0,w-1,(h-1)*w,h*w-1].map(i=>[d[i*4],d[i*4+1],d[i*4+2]]),base=corners[0];
 if(corners.some(v=>v.some((n,j)=>Math.abs(n-base[j])>32)))throw Error('This works best with a plain, even background. Keep this photo or use one taken against a plain wall.');
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const visit=i=>{if(i<0||i>=w*h||seen[i])return;seen[i]=1;const p=i*4;if(Math.max(Math.abs(d[p]-base[0]),Math.abs(d[p+1]-base[1]),Math.abs(d[p+2]-base[2]))<30){queue[tail++]=i;d[p+3]=0;}};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}while(head<tail){const i=queue[head++];if(i%w)visit(i-1);if(i%w<w-1)visit(i+1);visit(i-w);visit(i+w);}
 if(tail>w*h*.85||tail<w*h*.03)throw Error('The background could not be separated safely. Your original photo is unchanged.');return frame;}
