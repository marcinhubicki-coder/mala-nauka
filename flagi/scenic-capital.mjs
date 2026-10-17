// One building symbol for the paper heading and the geographic capital marker.
export function drawCapitalSymbol(ctx,x,y,size,{circle=false}={}){
 ctx.save();ctx.translate(x,y);ctx.scale(size/18,size/18);
 if(circle){ctx.fillStyle='#674321';ctx.strokeStyle='#fff0cb';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(9,9,8.5,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.translate(3.5,3);ctx.scale(.61,.61);}
 ctx.strokeStyle=circle?'#fff8e6':'#785637';ctx.lineWidth=1.25;ctx.lineJoin='round';ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(2,6);ctx.lineTo(9,1.5);ctx.lineTo(16,6);ctx.closePath();ctx.moveTo(2,8);ctx.lineTo(16,8);for(const x of [4,9,14]){ctx.moveTo(x,9);ctx.lineTo(x,14);}ctx.moveTo(2,15.5);ctx.lineTo(16,15.5);ctx.stroke();ctx.restore();
}
