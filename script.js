// ============ CONFIGURAÇÕES GLOBAIS ============
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
let width, height;
let scrollY = 0, lastScrollY = 0;
const STAR_COUNT = 250;
const SHOOTING_COUNT = 5;
const isMobile = window.innerWidth < 768;

let stars = [], shootingStars = [], sun, blackHole, planets;
let cursor;

// ============ CLASSE STAR ============
class Star {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5;
        this.brightness = Math.random() * 0.5 + 0.5;
        this.color = ['#fff', '#ffccff', '#ccffff'][Math.floor(Math.random() * 3)];
        this.twinkleSpeed = Math.random() * 0.03 + 0.01;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.originalX = this.x;
        this.originalY = this.y;
        this.stretchFactor = 1;
        this.isBeingSpaghettified = false;
    }
    draw() {
        const blink = Math.sin(Date.now() * 0.002 * this.brightness * 5 + this.twinklePhase) * 0.3 + 0.7;
        ctx.globalAlpha = this.brightness * blink;
        
        if (this.isBeingSpaghettified) {
            // Desenhar estrela esticada (efeito macarrão)
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.brightness * blink * 0.7;
            
            // Criar um efeito de trail/cauda
            const trailLength = this.size * this.stretchFactor * 8;
            const angle = Math.atan2(this.y - this.originalY, this.x - this.originalX);
            
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size * this.stretchFactor, this.size * 0.3, angle, 0, Math.PI * 2);
            ctx.fill();
            
            // Brilho da cauda
            ctx.globalAlpha = this.brightness * blink * 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(this.x - Math.cos(angle) * trailLength * 0.5, this.y - Math.sin(angle) * trailLength * 0.5, 
                       this.size * this.stretchFactor * 0.5, this.size * 0.2, angle, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    update() {
        const diff = scrollY - lastScrollY;
        this.y -= diff * (this.size * 0.05);
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }
}

// ============ CLASSE SHOOTING STAR ============
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
        const grad = ctx.createLinearGradient(this.x, this.y, this.x - this.len, this.y + this.len);
        grad.addColorStop(0, `rgba(255,255,255,${this.opacity})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.len, this.y + this.len);
        ctx.stroke();
    }
    update() {
        if (!this.active) {
            this.wait--;
            if (this.wait <= 0) this.active = true;
            return;
        }
        this.x += this.speed;
        this.y += this.speed * 0.5;
        this.opacity -= 0.02;
        if (this.opacity <= 0) this.reset();
    }
}

// ============ CLASSE BLACK HOLE (COM EFEITO ESPAGUETIFICAÇÃO) ============
class BlackHole {
    constructor() {
        this.radius = isMobile ? 40 : 60;
        this.rotation = 0;
        this.x = width * 0.8;
        this.y = height * 1.8;
        this.accretionDiskRotation = 0;
        this.eventHorizonPulse = 0;
        this.particles = [];
        this.photonRing = [];
        this.spaghettifiedStars = [];
        this.initializeParticles();
        this.initializePhotonRing();
    }

    initializeParticles() {
        for (let i = 0; i < 400; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.radius * (1.2 + Math.random() * 4);
            this.particles.push({
                angle: angle,
                distance: distance,
                speed: 0.012 + Math.random() * 0.05,
                opacity: Math.random() * 0.8 + 0.2,
                size: Math.random() * 3 + 0.5,
                color: this.getAccretionDiskColor(Math.random()),
                spiralIntensity: Math.random() * 0.7 + 0.3,
                temperature: Math.random() * 0.8 + 0.2,
                life: Math.random() * 500 + 300,
                wobble: Math.random() * Math.PI * 2
            });
        }
    }

    initializePhotonRing() {
        for (let i = 0; i < 150; i++) {
            const angle = (i / 150) * Math.PI * 2;
            this.photonRing.push({
                angle: angle,
                radius: this.radius * 2.6,
                brightness: Math.sin(i / 150 * Math.PI * 2) * 0.5 + 0.5,
                wobble: Math.random() * 0.1
            });
        }
    }

    getAccretionDiskColor(intensity) {
        if (intensity < 0.08) return 'rgba(255, 30, 0, 0.95)';
        if (intensity < 0.2) return 'rgba(255, 60, 10, 0.9)';
        if (intensity < 0.35) return 'rgba(255, 120, 30, 0.85)';
        if (intensity < 0.5) return 'rgba(255, 180, 80, 0.8)';
        if (intensity < 0.65) return 'rgba(255, 220, 130, 0.75)';
        if (intensity < 0.8) return 'rgba(255, 240, 170, 0.7)';
        return 'rgba(255, 255, 200, 0.65)';
    }

    update() {
        this.y = (height * 1.8) - (scrollY * 0.5);
        this.rotation += 0.008;
        this.accretionDiskRotation += 0.018;
        this.eventHorizonPulse = Math.sin(Date.now() * 0.004) * 0.15 + 1;

        // Atualizar partículas com física mais realista
        this.particles.forEach((p, idx) => {
            p.angle += p.speed * p.spiralIntensity;
            p.distance *= 0.9975; // Espiral mais lenta e realista
            p.wobble += 0.02;
            p.life--;
            p.opacity = Math.min(p.opacity, p.life / 300);

            if (p.distance < this.radius * 1.05 || p.life <= 0) {
                p.distance = this.radius * (1.2 + Math.random() * 4);
                p.angle = Math.random() * Math.PI * 2;
                p.opacity = Math.random() * 0.8 + 0.2;
                p.life = Math.random() * 500 + 300;
            }
        });

        // Atualizar foton ring
        this.photonRing.forEach((p, idx) => {
            p.angle += 0.03;
            p.brightness = Math.sin(Date.now() * 0.005 + idx * 0.05) * 0.4 + 0.6;
        });

        // EFEITO ESPAGUETIFICAÇÃO: Puxar e esticar estrelas
        stars.forEach(s => {
            const dx = this.x - s.x;
            const dy = this.y - s.y;
            const distSq = dx * dx + dy * dy;
            const eventHorizonSq = (this.radius * 3) * (this.radius * 3);

            if (distSq < eventHorizonSq * 4) {
                const dist = Math.sqrt(distSq);
                
                // Força gravitacional aumenta exponencialmente perto do buraco negro
                const force = Math.pow((eventHorizonSq * 4 - distSq) / (eventHorizonSq * 4), 2) * 0.08;
                
                s.x += dx * force;
                s.y += dy * force;

                // Calcular fator de esticamento (spaghettification)
                const stretchDistance = Math.max(0, this.radius * 3 - dist);
                s.stretchFactor = 1 + (stretchDistance / (this.radius * 3)) * 15; // Até 16x de esticamento
                s.isBeingSpaghettified = stretchDistance > this.radius * 0.5;

                // Remover estrela quando chegar muito perto
                if (dist < this.radius * 1.2) {
                    s.x = -9999;
                    s.y = -9999;
                }
            } else {
                s.stretchFactor = 1;
                s.isBeingSpaghettified = false;
            }
        });
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Desenhar camadas do disco de acreção
        this.drawAccretionDiskLayers();

        // Desenhar partículas com brilho
        this.drawAccretionParticles();

        // Desenhar foton ring (anel de fótons)
        this.drawPhotonRing();

        // Desenhar lentes gravitacionais
        this.drawGravitationalLensing();

        ctx.restore();

        // Desenhar event horizon
        this.drawEventHorizon();

        // Desenhar aura de radiação X-ray
        this.drawXRayAura();

        // Desenhar jets relativísticos
        this.drawRelativisticJets();
    }

    drawAccretionDiskLayers() {
        // Camada 1: Disco interno ultra-quente (branco-amarelo)
        ctx.save();
        ctx.rotate(this.accretionDiskRotation);
        const grad1 = ctx.createRadialGradient(0, 0, this.radius * 0.8, 0, 0, this.radius * 2.3);
        grad1.addColorStop(0, 'rgba(255, 255, 230, 0.98)');
        grad1.addColorStop(0.12, 'rgba(255, 245, 190, 0.95)');
        grad1.addColorStop(0.25, 'rgba(255, 220, 120, 0.9)');
        grad1.addColorStop(0.4, 'rgba(255, 180, 70, 0.8)');
        grad1.addColorStop(0.6, 'rgba(255, 120, 40, 0.6)');
        grad1.addColorStop(0.8, 'rgba(255, 60, 20, 0.3)');
        grad1.addColorStop(1, 'rgba(200, 20, 5, 0.05)');
        ctx.fillStyle = grad1;
        ctx.scale(2.3, 0.48);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Camada 2: Disco intermediário (laranja-vermelho intenso)
        ctx.save();
        ctx.rotate(this.accretionDiskRotation * 0.82);
        const grad2 = ctx.createRadialGradient(0, 0, this.radius * 1.7, 0, 0, this.radius * 3.3);
        grad2.addColorStop(0, 'rgba(255, 140, 40, 0.75)');
        grad2.addColorStop(0.25, 'rgba(255, 100, 30, 0.65)');
        grad2.addColorStop(0.5, 'rgba(220, 70, 20, 0.5)');
        grad2.addColorStop(0.75, 'rgba(150, 40, 15, 0.25)');
        grad2.addColorStop(1, 'rgba(80, 15, 5, 0.08)');
        ctx.fillStyle = grad2;
        ctx.scale(3.3, 0.43);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 3.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Camada 3: Disco externo (vermelho-escuro)
        ctx.save();
        ctx.rotate(this.accretionDiskRotation * 0.65);
        const grad3 = ctx.createRadialGradient(0, 0, this.radius * 2.8, 0, 0, this.radius * 4.8);
        grad3.addColorStop(0, 'rgba(180, 60, 30, 0.55)');
        grad3.addColorStop(0.4, 'rgba(120, 35, 20, 0.35)');
        grad3.addColorStop(0.7, 'rgba(70, 15, 10, 0.15)');
        grad3.addColorStop(1, 'rgba(30, 5, 2, 0.03)');
        ctx.fillStyle = grad3;
        ctx.scale(4.8, 0.38);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Estrutura de espiral turbulenta
        ctx.save();
        ctx.rotate(this.accretionDiskRotation * 1.15);
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * (1.4 + i * 0.75), 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // Turbulência e vórtices
        ctx.save();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.accretionDiskRotation * 0.5;
            const x = Math.cos(angle) * this.radius * 2.5;
            const y = Math.sin(angle) * this.radius * 2.5 * 0.4;
            
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = 'rgba(255, 100, 30, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawAccretionParticles() {
        this.particles.forEach(p => {
            const wobbleX = Math.sin(p.wobble) * p.distance * 0.1;
            const wobbleY = Math.cos(p.wobble) * p.distance * 0.05;
            const x = Math.cos(p.angle) * p.distance + wobbleX;
            const y = (Math.sin(p.angle) * p.distance + wobbleY) * 0.35;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity * 0.85;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Brilho especular intenso
            ctx.globalAlpha = p.opacity * 0.5;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(x - p.size * 0.4, y - p.size * 0.4, p.size * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // Halo ao redor da partícula
            ctx.globalAlpha = p.opacity * 0.25;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, p.size * 1.8, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    }

    drawPhotonRing() {
        ctx.save();
        ctx.globalAlpha = 0.8;

        this.photonRing.forEach((p, idx) => {
            const x = Math.cos(p.angle) * p.radius;
            const y = Math.sin(p.angle) * p.radius * 0.28;

            // Núcleo brilhante
            ctx.fillStyle = `rgba(255, 220, 120, ${p.brightness * 0.9})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Halo do anel de fótons
            ctx.strokeStyle = `rgba(255, 200, 80, ${p.brightness * 0.6})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.stroke();

            // Brilho externo
            ctx.globalAlpha = p.brightness * 0.3;
            ctx.strokeStyle = `rgba(255, 150, 50, ${p.brightness * 0.4})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.8;
        });

        ctx.restore();
    }

    drawGravitationalLensing() {
        ctx.save();
        ctx.globalAlpha = 0.12;

        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const waveAmount = Math.sin(Date.now() * 0.004 + angle) * 25 + Math.cos(Date.now() * 0.003 + angle * 2) * 15;
            const radius = this.radius * 6 + waveAmount;

            ctx.strokeStyle = `hsl(${200 + Math.sin(Date.now() * 0.002 + i) * 40}, 100%, 50%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawEventHorizon() {
        const pulseRadius = this.radius * this.eventHorizonPulse;

        // Aura interna (glow intenso)
        const auraGrad = ctx.createRadialGradient(this.x, this.y, pulseRadius * 0.6, this.x, this.y, pulseRadius * 1.6);
        auraGrad.addColorStop(0, 'rgba(0, 0, 0, 0.98)');
        auraGrad.addColorStop(0.4, 'rgba(100, 180, 220, 0.5)');
        auraGrad.addColorStop(1, 'rgba(150, 220, 255, 0.2)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseRadius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Event Horizon central (preto puro absoluto)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Borda brilhante externa
        ctx.strokeStyle = `rgba(220, 240, 255, ${0.75 * this.eventHorizonPulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Borda interna com cor de plasma
        ctx.strokeStyle = `rgba(255, 180, 100, ${0.5 * this.eventHorizonPulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseRadius * 0.93, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawXRayAura() {
        const radiationGrad = ctx.createRadialGradient(this.x, this.y, this.radius * 1.5, this.x, this.y, this.radius * 8);
        radiationGrad.addColorStop(0, 'rgba(255, 120, 60, 0.45)');
        radiationGrad.addColorStop(0.25, 'rgba(255, 180, 120, 0.3)');
        radiationGrad.addColorStop(0.5, 'rgba(220, 180, 160, 0.15)');
        radiationGrad.addColorStop(0.75, 'rgba(180, 160, 200, 0.08)');
        radiationGrad.addColorStop(1, 'rgba(150, 150, 220, 0.02)');
        ctx.fillStyle = radiationGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRelativisticJets() {
        const jetLength = this.radius * 9;
        const jetWidth = this.radius * 1;
        const jetIntensity = Math.sin(Date.now() * 0.004) * 0.3 + 0.5;

        for (let side = -1; side <= 1; side += 2) {
            ctx.save();
            ctx.translate(this.x, this.y + side * jetLength * 0.4);

            // Gradiente do jet com mais detalhes
            const jetGrad = ctx.createLinearGradient(0, -jetLength * 0.5, 0, jetLength * 0.5);
            jetGrad.addColorStop(0, `rgba(255, 220, 120, ${0.35 * jetIntensity})`);
            jetGrad.addColorStop(0.15, `rgba(255, 180, 80, ${0.4 * jetIntensity})`);
            jetGrad.addColorStop(0.4, `rgba(255, 140, 50, ${0.35 * jetIntensity})`);
            jetGrad.addColorStop(0.7, `rgba(255, 100, 30, ${0.2 * jetIntensity})`);
            jetGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');

            ctx.fillStyle = jetGrad;
            ctx.beginPath();
            ctx.moveTo(-jetWidth, -jetLength * 0.5);
            ctx.lineTo(jetWidth, -jetLength * 0.5);
            ctx.lineTo(jetWidth * 0.6, jetLength * 0.5);
            ctx.lineTo(-jetWidth * 0.6, jetLength * 0.5);
            ctx.closePath();
            ctx.fill();

            // Borda brilhante do jet
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = `rgba(255, 200, 100, ${0.4 * jetIntensity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-jetWidth, -jetLength * 0.5);
            ctx.lineTo(jetWidth, -jetLength * 0.5);
            ctx.lineTo(jetWidth * 0.6, jetLength * 0.5);
            ctx.lineTo(-jetWidth * 0.6, jetLength * 0.5);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    }
}

// ============ CLASSE PLANET (ULTRA-REALISTA) ============
class Planet {
    constructor(name, distance, radius, speed, colors, info, type = 'terrestrial') {
        this.name = name;
        this.distance = distance;
        this.radius = isMobile ? radius * 0.7 : radius;
        this.speed = speed;
        this.colors = colors;
        this.info = info;
        this.angle = Math.random() * Math.PI * 2;
        this.type = type;
        this.rotation = 0;
        this.atmosphereOpacity = 0.3;
        this.cloudRotation = 0;
        this.rings = type === 'gas_giant' ? this.generateRings() : null;
        this.spots = this.generateSpots();
        this.noiseMap = this.generateNoiseMap();
    }

    generateRings() {
        return {
            innerRadius: this.radius * 1.5,
            outerRadius: this.radius * 2.2,
            tilt: Math.random() * 0.5,
            opacity: 0.6
        };
    }

    generateSpots() {
        const spots = [];
        for (let i = 0; i < 3; i++) {
            spots.push({
                lat: Math.random() * Math.PI - Math.PI / 2,
                lon: Math.random() * Math.PI * 2,
                size: Math.random() * 0.3 + 0.1,
                color: `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.4)`,
                rotation: Math.random() * 0.01
            });
        }
        return spots;
    }

    generateNoiseMap() {
        const map = [];
        for (let i = 0; i < 16; i++) {
            map.push(Math.random());
        }
        return map;
    }

    update() {
        this.angle += this.speed;
        this.x = sun.x + Math.cos(this.angle) * this.distance;
        this.y = sun.y + Math.sin(this.angle) * this.distance;
        this.rotation += 0.005;
        this.cloudRotation += 0.003;
    }

    draw() {
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, this.distance, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.rings) {
            this.drawRings();
        }

        this.drawPlanetSurface();
        this.drawAtmosphere();
        this.drawLighting();

        ctx.restore();
    }

    drawPlanetSurface() {
        const grad = ctx.createRadialGradient(
            -this.radius * 0.3, -this.radius * 0.3, 0,
            0, 0, this.radius
        );

        grad.addColorStop(0, this.colors[0]);
        grad.addColorStop(0.5, this.colors[1]);
        grad.addColorStop(1, this.colors[2] || '#000');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        this.drawSurfacePatterns();

        if (this.type === 'gas_giant') {
            this.drawGasGiantSpots();
        }
    }

    drawSurfacePatterns() {
        ctx.save();
        ctx.globalAlpha = 0.4;

        for (let i = 0; i < 4; i++) {
            const x = Math.cos(this.rotation + i) * this.radius * 0.6;
            const y = Math.sin(this.rotation + i * 0.7) * this.radius * 0.4;
            const size = this.radius * (0.2 + this.noiseMap[i] * 0.2);

            ctx.fillStyle = `rgba(100, 150, 200, ${0.2 + this.noiseMap[i] * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawGasGiantSpots() {
        ctx.save();
        ctx.globalAlpha = 0.5;

        this.spots.forEach((spot, idx) => {
            const x = Math.cos(this.cloudRotation + spot.lon) * this.radius * 0.7;
            const y = Math.sin(this.cloudRotation * 0.5 + spot.lat) * this.radius * 0.5;
            const spotSize = this.radius * spot.size;

            ctx.fillStyle = spot.color;
            ctx.beginPath();
            ctx.ellipse(x, y, spotSize, spotSize * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(200, 150, 100, 0.3)`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        ctx.restore();
    }

    drawAtmosphere() {
        const atmosphereGrad = ctx.createRadialGradient(0, 0, this.radius * 0.9, 0, 0, this.radius * 1.3);
        atmosphereGrad.addColorStop(0, `rgba(100, 150, 255, ${this.atmosphereOpacity * 0.5})`);
        atmosphereGrad.addColorStop(0.5, `rgba(100, 200, 255, ${this.atmosphereOpacity * 0.2})`);
        atmosphereGrad.addColorStop(1, `rgba(100, 200, 255, 0)`);

        ctx.fillStyle = atmosphereGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'terrestrial') {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
            ctx.lineWidth = 1;

            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * (1.05 + i * 0.08), 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    drawLighting() {
        const shadowGrad = ctx.createRadialGradient(
            this.radius * 0.5, this.radius * 0.5, 0,
            0, 0, this.radius * 1.5
        );
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        const highlightGrad = ctx.createRadialGradient(
            -this.radius * 0.4, -this.radius * 0.4, 0,
            -this.radius * 0.4, -this.radius * 0.4, this.radius * 0.6
        );
        highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRings() {
        ctx.save();
        ctx.rotate(this.rings.tilt);

        const ringGrad = ctx.createRadialGradient(
            0, 0, this.rings.innerRadius,
            0, 0, this.rings.outerRadius
        );
        ringGrad.addColorStop(0, 'rgba(200, 180, 150, 0.5)');
        ringGrad.addColorStop(0.5, 'rgba(180, 160, 130, 0.6)');
        ringGrad.addColorStop(1, 'rgba(150, 130, 100, 0.3)');

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.rings.outerRadius, this.rings.outerRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.rings.innerRadius * 0.95, this.rings.innerRadius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============ CLASSE SUN (PLASMA VOLUMÉTRICO ORGÂNICO) ============
class Sun {
    constructor() {
        this.radius = isMobile ? 60 : 80;
        this.flares = this.generateFlares();
        this.prominences = this.generateProminences();
        this.granules = this.generateGranules();
        this.coronalMass = this.generateCoronalMass();
        this.plasmaCells = this.generatePlasmaCells();
        this.turbulence = 0;
    }

    generateFlares() {
        const flares = [];
        for (let i = 0; i < 12; i++) {
            flares.push({
                angle: Math.random() * Math.PI * 2,
                size: Math.random() * 0.6 + 0.1,
                intensity: Math.random() * 0.7 + 0.1,
                speed: Math.random() * 0.02 + 0.003,
                life: Math.random() * 400 + 150,
                maxLife: 0
            });
        }
        return flares;
    }

    generateProminences() {
        const prominences = [];
        for (let i = 0; i < 16; i++) {
            prominences.push({
                angle: (i / 16) * Math.PI * 2,
                height: Math.random() * 0.5 + 0.1,
                width: Math.random() * 0.25 + 0.05,
                intensity: Math.random() * 0.6 + 0.15,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 0.015 + 0.003
            });
        }
        return prominences;
    }

    generateGranules() {
        const granules = [];
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.9;
            granules.push({
                angle: angle,
                radius: radius,
                size: Math.random() * 0.12 + 0.02,
                brightness: Math.random() * 0.5 + 0.2,
                speed: Math.random() * 0.008 + 0.001,
                wobble: Math.random() * Math.PI * 2
            });
        }
        return granules;
    }

    generateCoronalMass() {
        const mass = [];
        for (let i = 0; i < 30; i++) {
            mass.push({
                angle: Math.random() * Math.PI * 2,
                distance: Math.random() * 0.4 + 0.15,
                size: Math.random() * 0.2 + 0.05,
                brightness: Math.random() * 0.4 + 0.05,
                speed: Math.random() * 0.01 + 0.001,
                wobble: Math.random() * Math.PI * 2
            });
        }
        return mass;
    }

    generatePlasmaCells() {
        const cells = [];
        for (let i = 0; i < 120; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.85 + 0.1;
            cells.push({
                angle: angle,
                radius: radius,
                size: Math.random() * 0.08 + 0.02,
                brightness: Math.random() * 0.6 + 0.2,
                speed: Math.random() * 0.012 + 0.002,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 0.02 + 0.005,
                color: ['rgba(255, 255, 200, ', 'rgba(255, 240, 150, ', 'rgba(255, 220, 100, '][Math.floor(Math.random() * 3)]
            });
        }
        return cells;
    }

    update() {
        this.x = width / 2;
        this.y = (height / 2) - (scrollY * 0.1);
        this.turbulence += 0.01;

        this.flares.forEach(f => {
            f.angle += f.speed;
            f.life--;
            f.maxLife = Math.max(f.maxLife, f.life);
            if (f.life <= 0) {
                f.angle = Math.random() * Math.PI * 2;
                f.life = Math.random() * 400 + 150;
                f.maxLife = f.life;
                f.intensity = Math.random() * 0.7 + 0.1;
            }
            f.intensity = Math.sin(Date.now() * 0.004 + f.angle) * 0.35 + 0.45;
        });

        this.prominences.forEach(p => {
            p.wobble += p.wobbleSpeed;
            p.intensity = Math.sin(Date.now() * 0.002 + p.angle + this.turbulence) * 0.3 + 0.4;
        });

        this.granules.forEach(g => {
            g.angle += g.speed;
            g.wobble += 0.01;
            g.brightness = Math.sin(Date.now() * 0.005 + g.angle + g.wobble) * 0.25 + 0.4;
        });

        this.coronalMass.forEach(c => {
            c.angle += c.speed;
            c.wobble += 0.008;
            c.brightness = Math.sin(Date.now() * 0.003 + c.angle + c.wobble) * 0.2 + 0.25;
        });

        this.plasmaCells.forEach(p => {
            p.angle += p.speed;
            p.wobble += p.wobbleSpeed;
            p.brightness = Math.sin(Date.now() * 0.006 + p.angle + p.wobble) * 0.3 + 0.45;
        });
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Desenhar corona
        this.drawCorona();

        // Desenhar células de plasma
        this.drawPlasmaCells();

        // Desenhar proeminências
        this.drawProminences();

        // Desenhar massa coronal
        this.drawCoronalMass();

        // Desenhar flares
        this.drawFlares();

        ctx.restore();

        // Desenhar núcleo
        this.drawCore();

        // Desenhar granulação
        this.drawGranulation();

        // Desenhar aura de radiação
        this.drawRadiationAura();
    }

    drawCore() {
        // Núcleo do sol com gradiente ultra-realista
        const coreGrad = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius
        );
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.08, '#fffef0');
        coreGrad.addColorStop(0.15, '#fffacd');
        coreGrad.addColorStop(0.25, '#ffff99');
        coreGrad.addColorStop(0.35, '#ffeb3b');
        coreGrad.addColorStop(0.5, '#ffc107');
        coreGrad.addColorStop(0.65, '#ffb300');
        coreGrad.addColorStop(0.8, '#ff9800');
        coreGrad.addColorStop(0.9, '#ff7f00');
        coreGrad.addColorStop(1, '#e65100');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Manchas solares dinâmicas
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + this.turbulence * 0.2;
            const x = this.x + Math.cos(angle) * this.radius * 0.55;
            const y = this.y + Math.sin(angle) * this.radius * 0.55;
            const spotSize = this.radius * (0.08 + Math.sin(this.turbulence + i) * 0.05);
            
            ctx.fillStyle = 'rgba(80, 30, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, spotSize, 0, Math.PI * 2);
            ctx.fill();

            // Penumbra ao redor da mancha
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = 'rgba(100, 50, 20, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y, spotSize * 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.3;
        }
        ctx.restore();
    }

    drawCorona() {
        // Corona multi-camada ultra-realista
        const coronaLayers = [
            { radius: this.radius * 1.15, color: 'rgba(255, 220, 120, 0.35)' },
            { radius: this.radius * 1.4, color: 'rgba(255, 200, 100, 0.25)' },
            { radius: this.radius * 1.7, color: 'rgba(255, 170, 80, 0.18)' },
            { radius: this.radius * 2.1, color: 'rgba(255, 140, 60, 0.12)' },
            { radius: this.radius * 2.6, color: 'rgba(255, 110, 50, 0.08)' },
            { radius: this.radius * 3.2, color: 'rgba(255, 80, 40, 0.04)' }
        ];

        coronaLayers.forEach((layer, idx) => {
            const coronaGrad = ctx.createRadialGradient(0, 0, this.radius * 0.7, 0, 0, layer.radius);
            coronaGrad.addColorStop(0, layer.color);
            coronaGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
            ctx.fillStyle = coronaGrad;
            ctx.beginPath();
            ctx.arc(0, 0, layer.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawFlares() {
        this.flares.forEach(f => {
            const x = Math.cos(f.angle) * this.radius * 1.35;
            const y = Math.sin(f.angle) * this.radius * 1.35;
            const size = this.radius * f.size;

            ctx.save();
            ctx.globalAlpha = f.intensity * 0.85;
            
            // Núcleo do flare
            ctx.fillStyle = 'rgba(255, 255, 180, 0.95)';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            // Camada intermediária
            ctx.globalAlpha = f.intensity * 0.6;
            ctx.fillStyle = 'rgba(255, 220, 100, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Núcleo brilhante
            ctx.globalAlpha = f.intensity * 0.4;
            ctx.fillStyle = 'rgba(255, 240, 150, 0.9)';
            ctx.beginPath();
            ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // Halo externo
            ctx.globalAlpha = f.intensity * 0.25;
            ctx.strokeStyle = 'rgba(255, 200, 80, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        });
    }

    drawProminences() {
        this.prominences.forEach(p => {
            const baseX = Math.cos(p.angle) * this.radius;
            const baseY = Math.sin(p.angle) * this.radius;
            const height = this.radius * (p.height + Math.sin(p.wobble) * 0.15);
            const tipX = Math.cos(p.angle) * height;
            const tipY = Math.sin(p.angle) * height;

            ctx.save();
            ctx.globalAlpha = p.intensity * 0.8;
            
            // Camada externa (mais vermelha)
            ctx.strokeStyle = `rgba(255, 100, 50, ${0.6 * p.intensity})`;
            ctx.lineWidth = this.radius * p.width * 2.2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(
                baseX + Math.cos(p.angle + Math.PI / 2) * this.radius * 0.25,
                baseY + Math.sin(p.angle + Math.PI / 2) * this.radius * 0.25,
                tipX,
                tipY
            );
            ctx.stroke();

            // Camada interna (mais amarela)
            ctx.globalAlpha = p.intensity * 0.5;
            ctx.strokeStyle = `rgba(255, 180, 80, ${0.7 * p.intensity})`;
            ctx.lineWidth = this.radius * p.width * 1.2;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(
                baseX + Math.cos(p.angle + Math.PI / 2) * this.radius * 0.25,
                baseY + Math.sin(p.angle + Math.PI / 2) * this.radius * 0.25,
                tipX,
                tipY
            );
            ctx.stroke();

            ctx.restore();
        });
    }

    drawCoronalMass() {
        this.coronalMass.forEach(c => {
            const x = Math.cos(c.angle) * this.radius * (1 + c.distance);
            const y = Math.sin(c.angle) * this.radius * (1 + c.distance);

            ctx.save();
            ctx.globalAlpha = c.brightness * 0.6;
            
            // Núcleo
            ctx.fillStyle = `rgba(255, 220, 120, ${0.7 * c.brightness})`;
            ctx.beginPath();
            ctx.arc(x, y, this.radius * c.size, 0, Math.PI * 2);
            ctx.fill();

            // Borda
            ctx.globalAlpha = c.brightness * 0.4;
            ctx.strokeStyle = `rgba(255, 180, 80, ${0.6 * c.brightness})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, this.radius * c.size, 0, Math.PI * 2);
            ctx.stroke();

            // Halo externo
            ctx.globalAlpha = c.brightness * 0.2;
            ctx.strokeStyle = `rgba(255, 150, 50, ${0.4 * c.brightness})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, this.radius * c.size * 1.8, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        });
    }

    drawPlasmaCells() {
        this.plasmaCells.forEach(p => {
            const x = Math.cos(p.angle) * this.radius * p.radius;
            const y = Math.sin(p.angle) * this.radius * p.radius;

            ctx.save();
            ctx.globalAlpha = p.brightness * 0.5;
            ctx.fillStyle = p.color + (p.brightness * 0.7) + ')';
            ctx.beginPath();
            ctx.arc(x, y, this.radius * p.size, 0, Math.PI * 2);
            ctx.fill();

            // Brilho
            ctx.globalAlpha = p.brightness * 0.3;
            ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
            ctx.beginPath();
            ctx.arc(x - this.radius * p.size * 0.3, y - this.radius * p.size * 0.3, this.radius * p.size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawGranulation() {
        this.granules.forEach(g => {
            const x = this.x + Math.cos(g.angle) * this.radius * g.radius;
            const y = this.y + Math.sin(g.angle) * this.radius * g.radius;

            ctx.save();
            ctx.globalAlpha = g.brightness * 0.45;
            ctx.fillStyle = 'rgba(255, 255, 220, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, this.radius * g.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = g.brightness * 0.25;
            ctx.strokeStyle = 'rgba(255, 220, 150, 0.5)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.arc(x, y, this.radius * g.size, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        });
    }

    drawRadiationAura() {
        // Aura de radiação térmica ultra-realista
        const auraLayers = [
            { radius: this.radius * 3.5, color: 'rgba(255, 220, 120, 0.35)' },
            { radius: this.radius * 4.5, color: 'rgba(255, 180, 100, 0.25)' },
            { radius: this.radius * 5.5, color: 'rgba(255, 140, 80, 0.15)' },
            { radius: this.radius * 6.5, color: 'rgba(255, 100, 60, 0.08)' }
        ];

        auraLayers.forEach(layer => {
            const auraGrad = ctx.createRadialGradient(
                this.x, this.y, this.radius * 1.3,
                this.x, this.y, layer.radius
            );
            auraGrad.addColorStop(0, layer.color);
            auraGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, layer.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// ============ INICIALIZAÇÃO ============
function init() {
    document.body.style.margin = '0';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';

    resize();
    stars = Array.from({ length: STAR_COUNT }, () => new Star());
    shootingStars = Array.from({ length: SHOOTING_COUNT }, () => new ShootingStar());
    sun = new Sun();
    blackHole = new BlackHole();
    planets = [
        new Planet('TERRA', 220, 12, 0.005, ['#4fc3f7', '#2e7d32', '#01579b'], 'SISTEMA DE VIDA DETECTADO.', 'terrestrial'),
        new Planet('MARTE', 300, 8, 0.004, ['#ff5722', '#bf360c', '#3e1105'], 'BASE DE PESQUISA AVANÇADA.', 'terrestrial'),
        new Planet('JÚPITER', 420, 25, 0.002, ['#d39c7e', '#c99039', '#5d4037'], 'GIGANTE GASOSO EM OBSERVAÇÃO.', 'gas_giant')
    ];

    if (!isMobile) {
        cursor = document.createElement('div');
        cursor.id = 'custom-cursor';
        document.body.appendChild(cursor);
        window.addEventListener('mousemove', e => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
    }

    animate();
}

// ============ LOOP DE ANIMAÇÃO ============
function animate() {
    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 1;
    stars.forEach(s => { s.update(); s.draw(); });
    shootingStars.forEach(s => { s.update(); s.draw(); });
    sun.update();
    sun.draw();
    planets.forEach(p => { p.update(); p.draw(); });
    blackHole.update();
    blackHole.draw();

    lastScrollY = scrollY;
    requestAnimationFrame(animate);
}

// ============ EVENTOS ============
window.addEventListener('resize', resize);
window.addEventListener('scroll', () => { scrollY = window.pageYOffset; });

// ============ INTERSECTION OBSERVER PARA PROJETOS ============
document.querySelectorAll('.project-card').forEach(card => {
    new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 }).observe(card);
});

// ============ RESIZE ============
function resize() {
    width = Math.min(window.innerWidth, document.documentElement.clientWidth);
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

// ============ INICIALIZA ============
init();
