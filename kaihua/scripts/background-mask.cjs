// Only near-white pixels reachable from the canvas boundary become transparent.
// Closed white repair patches inside the photographed painting remain opaque.
function edgeConnectedMask(data,width,height,channels,{minimumChannel=244,maximumChroma=16}={}){
 const n=width*height,alpha=new Uint8Array(n).fill(255),queue=new Uint32Array(n);let head=0,tail=0;
 const white=i=>{const at=i*channels,r=data[at],g=data[at+1],b=data[at+2];return Math.min(r,g,b)>=minimumChannel&&Math.max(r,g,b)-Math.min(r,g,b)<=maximumChroma};
 function visit(i){if(alpha[i]&&white(i)){alpha[i]=0;queue[tail++]=i}}
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x)}
 for(let y=1;y<height-1;y++){visit(y*width);visit(y*width+width-1)}
 while(head<tail){const i=queue[head++],x=i%width;if(x)visit(i-1);if(x<width-1)visit(i+1);if(i>=width)visit(i-width);if(i<n-width)visit(i+width)}
 return {alpha,width,height,transparentPixels:tail};
}
module.exports={edgeConnectedMask};
