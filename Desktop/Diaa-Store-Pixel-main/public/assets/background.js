// ===== CYBER KEY — Animated particle background with floating data nodes =====
(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    let w, h, time = 0;
    let mouseX = 0, mouseY = 0;

    // Floating data nodes
    const nodes = [];
    const MAX_NODES = 40;

    // Data particles
    const dataParticles = [];
    const MAX_PARTICLES = 60;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        if (nodes.length === 0) {
            for (let i = 0; i < MAX_NODES; i++) nodes.push(createNode());
            mouseX = w / 2;
            mouseY = h / 2;
        }
        for (let i = 0; i < MAX_PARTICLES; i++) {
            if (dataParticles.length < MAX_PARTICLES) dataParticles.push(createParticle());
        }
    }

    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
    document.addEventListener('touchmove', (e) => {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }, { passive: true });

    function lerp(a, b, t) { return a + (b - a) * t; }
    function rand(min, max) { return Math.random() * (max - min) + min; }

    // Node: floating hexagonal data point
    function createNode() {
        return {
            x: rand(0, w || window.innerWidth),
            y: rand(0, h || window.innerHeight),
            vx: rand(-0.15, 0.15),
            vy: rand(-0.12, 0.12),
            size: rand(2, 5),
            pulse: rand(0, Math.PI * 2),
            pulseSpeed: rand(0.008, 0.025),
            alpha: rand(0.04, 0.18),
            color: Math.random() > 0.6 ? [0, 200, 255] : Math.random() > 0.5 ? [59, 107, 255] : [0, 229, 160],
            connected: false
        };
    }

    // Floating data particle
    function createParticle() {
        const isHorizontal = Math.random() > 0.5;
        return {
            x: rand(0, w || window.innerWidth),
            y: rand(0, h || window.innerHeight),
            vx: isHorizontal ? rand(0.3, 0.8) * (Math.random() > 0.5 ? 1 : -1) : rand(-0.05, 0.05),
            vy: isHorizontal ? rand(-0.05, 0.05) : rand(0.2, 0.6) * (Math.random() > 0.5 ? 1 : -1),
            size: rand(0.5, 1.5),
            alpha: rand(0.03, 0.12),
            life: rand(0, 1),
            decay: rand(0.001, 0.004),
            color: Math.random() > 0.5 ? [0, 200, 255] : [59, 107, 255]
        };
    }

    function drawGrid() {
        const gridSize = 80;
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.018)';
        ctx.lineWidth = 0.5;

        // Slight perspective shift based on mouse
        const offsetX = (mouseX / w - 0.5) * 8;
        const offsetY = (mouseY / h - 0.5) * 8;

        for (let x = (offsetX % gridSize); x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = (offsetY % gridSize); y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    function drawConnections() {
        const connectionDist = 140;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < connectionDist) {
                    const strength = 1 - dist / connectionDist;
                    const c = nodes[i].color;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${strength * 0.06})`;
                    ctx.lineWidth = strength * 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    function drawNodes() {
        for (const node of nodes) {
            // Update
            node.x += node.vx;
            node.y += node.vy;
            node.pulse += node.pulseSpeed;

            // Mouse repulsion (subtle)
            const dx = node.x - mouseX;
            const dy = node.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                node.vx += (dx / dist) * 0.02;
                node.vy += (dy / dist) * 0.02;
            }

            // Dampen velocity
            node.vx *= 0.99;
            node.vy *= 0.99;

            // Boundary wrap
            if (node.x < -20) node.x = w + 20;
            if (node.x > w + 20) node.x = -20;
            if (node.y < -20) node.y = h + 20;
            if (node.y > h + 20) node.y = -20;

            // Draw
            const pulsedAlpha = node.alpha * (0.5 + 0.5 * Math.sin(node.pulse));
            const pulsedSize = node.size * (0.9 + 0.1 * Math.sin(node.pulse));
            const [r, g, b] = node.color;

            ctx.save();
            // Glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${r},${g},${b},0.3)`;

            // Core dot
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulsedSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${pulsedAlpha})`;
            ctx.fill();

            // Outer ring for bigger nodes
            if (node.size > 3.5) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, pulsedSize * 2, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${r},${g},${b},${pulsedAlpha * 0.3})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    function drawDataParticles() {
        for (let i = dataParticles.length - 1; i >= 0; i--) {
            const p = dataParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
                dataParticles[i] = createParticle();
                continue;
            }

            const [r, g, b] = p.color;
            ctx.beginPath();
            ctx.rect(p.x, p.y, p.size * 2, p.size * 0.5);
            ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha * p.life})`;
            ctx.fill();
        }
    }

    function drawMouseGlow() {
        const glow = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 120);
        glow.addColorStop(0, 'rgba(0,200,255,0.025)');
        glow.addColorStop(0.5, 'rgba(0,150,200,0.01)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
    }

    function draw() {
        time += 0.008;
        ctx.clearRect(0, 0, w, h);

        drawGrid();
        drawConnections();
        drawNodes();
        drawDataParticles();
        drawMouseGlow();

        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
})();


// DOM Floating Particles
window.addEventListener('DOMContentLoaded', function() {
    var c = document.getElementById('particles-overlay');
    if (!c) return;
    var cols = ['rgba(0,210,255,', 'rgba(91,110,245,', 'rgba(155,92,245,', 'rgba(0,229,160,'];
    for (var i = 0; i < 22; i++) {
        var p = document.createElement('div');
        p.className = 'particle';
        var sz = Math.random() * 3 + 1.5;
        var col = cols[Math.floor(Math.random() * cols.length)];
        var dur = Math.random() * 14 + 9;
        var del = -(Math.random() * 12);
        p.style.width = sz + 'px';
        p.style.height = sz + 'px';
        p.style.left = (Math.random() * 100) + '%';
        p.style.background = col + '0.7)';
        p.style.boxShadow = '0 0 ' + (sz * 4) + 'px ' + col + '0.4)';
        p.style.animationDuration = dur + 's';
        p.style.animationDelay = del + 's';
        c.appendChild(p);
    }
});
