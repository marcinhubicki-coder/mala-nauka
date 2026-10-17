// QA harness: the editor itself receives a real narrow CSS viewport.
const size=document.getElementById('phone-size'),frame=document.getElementById('mobile-studio');
size.addEventListener('change',()=>{const [width,height]=size.value.split(',').map(Number);frame.style.width=width+'px';frame.style.height=height+'px';});
