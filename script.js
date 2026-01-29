const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];
let shootingStars = [];
let sun;
let planets = [];
let blackHole;
let scrollY = 0;
let lastScrollY = 0;
let cursor;

const isMobile = window.innerWidth < 768;
const STAR_COUNT = isMobile ? 400 : 2000; 
const SHOOTING_COUNT = isMobile ? 1 : 3;

// ---------------- Classes ----------------

class Star {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * (isMobile ? 0.8 : 1.2);
        this.brightness = Math.random();
        this.color = ['#fff','#fff4ea','#f8f7ff','#bbccff','#ffd2a1'][Math.floor(Math.random()*5)];
    }
    draw() {
        const blink = Math.sin(Date.now() * 0.002 * this.brightness * 5) * 0.3 + 0.7;
        ctx.globalAlpha = this.brightness * blink;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
    }
    update() {
        const diff = scrollY - lastScrollY;
        this.y -= diff * (this.size * 0.05);
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }
}

class ShootingStar {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height * 0.5;
        this.len = Math.random() * (isMobile ? 100 : 200) + (isMobile ? 50 : 100);
        this.speed = Math.random() * (isMobile ? 8 : 12) + (isMobile ? 5 : 8);
        this.opacity = 1;
        this.active = false;
        this.wait = Math.random() * 400;
    }
    draw() {
        if (!this.active) return;
        const grad = ctx.createLinearGradient(this.x,this.y,this.x-this.len,this.y+this.len);
        grad.addColorStop(0, `rgba(255,255,255,${this.opacity})`);
        grad.addColorStop(1,'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.x-this.len,this.y+this.len);
        ctx.stroke();
    }
    update() {
        if (!this.active) { this.wait--; if(this.wait<=0) this.active=true; return; }
        this.x += this.speed;
        this.y += this.speed*0.5;
        this.opacity -= 0.02;
        if(this.opacity <= 0) this.reset();
    }
}

class BlackHole {
    constructor() {
        this.radius = isMobile ? 40 : 60;
        this.rotation = 0;
        this.x = width*0.8;
        this.y = height*1.8;
    }
    update() {
        this.y = (height*1.8)-(scrollY*0.5);
        this.rotation += 0.005;
        if(!isMobile){
            stars.forEach(s=>{
                const dx=this.x-s.x, dy=this.y-s.y;
                const distSq=dx*dx+dy*dy;
                if(distSq<90000){
                    const dist=Math.sqrt(distSq);
                    const force=(300-dist)/2000;
                    s.x+=dx*force; s.y+=dy*force;
                }
            });
        }
    }
    draw(){
        ctx.save();
        ctx.translate(this.x,this.y);
        this.drawAccretionDisk(this.rotation,4,0.4);
        this.drawAccretionDisk(this.rotation+Math.PI/2,3.5,1.2);
        ctx.restore();

        ctx.fillStyle='#000';
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
        ctx.fill();
    }
    drawAccretionDisk(rot,scaleX,scaleY){
        ctx.save();
        ctx.rotate(rot);
        const grad=ctx.createRadialGradient(0,0,this.radius,0,0,this.radius*scaleX);
        grad.addColorStop(0,'rgba(255,255,255,0.9)');
        grad.addColorStop(0.2,'rgba(255,180,50,0.7)');
        grad.addColorStop(0.5,'rgba(255,80,0,0.3)');
        grad.addColorStop(1,'transparent');
        ctx.fillStyle=grad;
        ctx.scale(scaleX,scaleY);
        ctx.beginPath();
        ctx.arc(0,0,this.radius*scaleX,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

class Planet {
    constructor(name,distance,radius,speed,colors,info){
        this.name=name; 
        this.distance=distance; 
        this.radius=isMobile?radius*0.7:radius;
        this.speed=speed; 
        this.colors=colors; 
        this.info=info;
        this.angle=Math.random()*Math.PI*2;
    }
    update(){
        this.angle+=this.speed;
        this.x=sun.x+Math.cos(this.angle)*this.distance;
        this.y=sun.y+Math.sin(this.angle)*this.distance;
    }
    draw(){
        ctx.strokeStyle='rgba(0,242,255,0.1)';
        ctx.beginPath();
        ctx.arc(sun.x,sun.y,this.distance,0,Math.PI*2);
        ctx.stroke();
        const grad=ctx.createRadialGradient(this.x-this.radius*0.3,this.y-this.radius*0.3,0,this.x,this.y,this.radius);
        grad.addColorStop(0,this.colors[0]);
        grad.addColorStop(0.5,this.colors[1]);
        grad.addColorStop(1,this.colors[2]||'#000');
        ctx.fillStyle=grad;
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
        ctx.fill();
    }
}

class Sun {
    constructor(){ this.radius=isMobile?60:80; }
    update(){ this.x=width/2; this.y=(height/2)-(scrollY*0.1); }
    draw(){
        const glow=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius*3);
        glow.addColorStop(0,'rgba(255,200,50,0.4)');
        glow.addColorStop(1,'transparent');
        ctx.fillStyle=glow;
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius*3,0,Math.PI*2);
        ctx.fill();
        const core=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius);
        core.addColorStop(0,'#fff'); 
        core.addColorStop(0.2,'#ffea00'); 
        core.addColorStop(1,'#ff6a00');
        ctx.fillStyle=core;
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
        ctx.fill();
    }
}

// ---------------- Inicialização ----------------
function init(){
    // Remove scroll horizontal
    document.body.style.margin = '0';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';

    resize();
    stars = Array.from({length:STAR_COUNT},()=>new Star());
    shootingStars = Array.from({length:SHOOTING_COUNT},()=>new ShootingStar());
    sun=new Sun();
    blackHole=new BlackHole();
    planets=[
        new Planet('TERRA',220,12,0.005,['#4fc3f7','#2e7d32','#01579b'],'SISTEMA DE VIDA DETECTADO.'),
        new Planet('MARTE',300,8,0.004,['#ff5722','#bf360c','#3e1105'],'BASE DE PESQUISA AVANÇADA.'),
        new Planet('JÚPITER',420,25,0.002,['#d39c7e','#c99039','#5d4037'],'GIGANTE GASOSO EM OBSERVAÇÃO.')
    ];

    if(!isMobile){
        cursor=document.createElement('div');
        cursor.id='custom-cursor';
        document.body.appendChild(cursor);
        window.addEventListener('mousemove',e=>{
            cursor.style.left=e.clientX+'px';
            cursor.style.top=e.clientY+'px';
        });
    }

    animate();
}

// ---------------- Loop ----------------
function animate(){
    ctx.fillStyle='#020205';
    ctx.fillRect(0,0,width,height);
    stars.forEach(s=>{s.update(); s.draw();});
    shootingStars.forEach(s=>{s.update(); s.draw();});
    sun.update(); sun.draw();
    planets.forEach(p=>{p.update(); p.draw();});
    blackHole.update(); blackHole.draw();
    lastScrollY=scrollY;
    requestAnimationFrame(animate);
}

// ---------------- Eventos ----------------
window.addEventListener('resize',resize);
window.addEventListener('scroll',()=>{scrollY=window.pageYOffset;});

// ---------------- IntersectionObserver para projetos ----------------
document.querySelectorAll('.project-card').forEach(card=>{
    new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, {threshold:0.1}).observe(card);
});

// ---------------- Resize ----------------
function resize(){
    width = Math.min(window.innerWidth, document.documentElement.clientWidth);
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

// ---------------- Inicializa ----------------
init();
