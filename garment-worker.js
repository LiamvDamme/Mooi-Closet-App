import * as ort from '/assets/ort.wasm.min.mjs';
const modelUrl='https://huggingface.co/Ko033/isnet-general-use-onnx/resolve/5349b617911fd60c619b52f32e2b593517b78df3/onnx/model_quantized.onnx';
ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths=new URL('/assets/',self.location.origin).href;
let sessionPromise;
async function session(id){
 if(!sessionPromise)sessionPromise=(async()=>{
  let cache,cached;try{cache=await caches.open('mooi-garment-model-v1');cached=await cache.match(modelUrl);}catch{}
  let bytes;if(cached)bytes=await cached.arrayBuffer();else{
   const response=await fetch(modelUrl,{signal:AbortSignal.timeout(90000)});if(!response.ok)throw Error('Model unavailable');
   const total=Number(response.headers.get('content-length'))||45900000,reader=response.body.getReader(),chunks=[];let received=0;
   while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.length;postMessage({id,progress:'Downloading free cleanup model… '+Math.min(99,Math.round(received/total*100))+'%'});}
   const joined=new Uint8Array(received);let at=0;for(const chunk of chunks){joined.set(chunk,at);at+=chunk.length;}bytes=joined.buffer;try{await cache?.put(modelUrl,new Response(bytes.slice(0)));}catch{}
  }
  postMessage({id,progress:'Preparing automatic background cleanup…'});return ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
 })().catch(e=>{sessionPromise=null;throw e;});return sessionPromise;
}
let queue=Promise.resolve();
self.onmessage=({data})=>{queue=queue.catch(()=>{}).then(async()=>{const {id,width,height,rgba}=data;try{
 const model=await session(id);postMessage({id,progress:'Separating your garment from the background…'});
 const source=new OffscreenCanvas(width,height),ctx=source.getContext('2d');ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba),width,height),0,0);
 const size=512,input=new OffscreenCanvas(size,size),ic=input.getContext('2d');ic.drawImage(source,0,0,size,size);const pixels=ic.getImageData(0,0,size,size).data,n=size*size,tensor=new Float32Array(n*3);
 for(let i=0;i<n;i++)for(let c=0;c<3;c++)tensor[c*n+i]=pixels[i*4+c]/255-.5;
 const inputTensor=new ort.Tensor('float32',tensor,[1,3,size,size]);let output;try{output=await model.run({[model.inputNames[0]]:inputTensor});}finally{inputTensor.dispose();}const mask=output[model.outputNames[0]],mh=mask.dims.at(-2),mw=mask.dims.at(-1);let lo=Infinity,hi=-Infinity;for(const v of mask.data){lo=Math.min(lo,v);hi=Math.max(hi,v);}if(hi-lo<.01)throw Error('No clear garment found');
 const matte=new OffscreenCanvas(mw,mh),mc=matte.getContext('2d'),frame=mc.createImageData(mw,mh);for(let i=0;i<mw*mh;i++){frame.data[i*4]=frame.data[i*4+1]=frame.data[i*4+2]=255;const alpha=(mask.data[i]-lo)/(hi-lo);frame.data[i*4+3]=alpha<.03?0:alpha>.97?255:Math.round(alpha*255);}mc.putImageData(frame,0,0);
 ctx.globalCompositeOperation='destination-in';ctx.drawImage(matte,0,0,width,height);const cutout=ctx.getImageData(0,0,width,height);postMessage({id,width,height,rgba:cutout.data.buffer},[cutout.data.buffer]);
 for(const value of Object.values(output))value.dispose();
 }catch(e){console.warn('Garment cleanup could not finish: '+e.message);postMessage({id,error:'Automatic cleanup could not finish. Try again or touch up the background.'});}});};
