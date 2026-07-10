/* ============================================================
   LemoClaw 公共脚本 common.js
   包含三个页面共享的逻辑：
     1. 背景流星光柱动画（沿网格线飞行）
     2. 滚动渐显（Intersection Observer）
     3. 移动端汉堡菜单交互
   各页面只需 <script src="js/common.js"></script> 引用即可，
   页面自身的渲染 / 交互逻辑仍保留在各 HTML 内联脚本中。
   ============================================================ */

/* ========== 背景流星光柱 · 沿网格线飞行 ========== */
(function () {
    const CONFIG = {
        maxMeteors: 8,            // 同屏最多 8 颗
        grid: 50,                 // 与 body::before 网格大小一致
        minTail: 100,
        maxTail: 280,
        minInterval: 500,         // 随机生成间隔 0.5~1.8s
        maxInterval: 1800,
        minSpeed: 180,            // px/s
        maxSpeed: 340,
        // 与游戏卡片配色呼应的 5 色调色板
        colors: [
            [120, 130, 255], // 🔵 蓝紫
            [255, 180, 90],  // 🟡 金橙
            [255, 120, 200], // 💗 粉紫
            [100, 255, 180], // 🟢 青绿
            [180, 140, 255], // 💜 紫
        ],
    };

    const canvas = document.getElementById('meteorCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, DPR = 1;
    const meteors = [];
    let lastSpawn = 0;
    let nextSpawn = randInterval();

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function randInterval() { return rand(CONFIG.minInterval, CONFIG.maxInterval); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // DPR 适配 + resize 自适应
    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    // 沿网格线（对齐 50px 网格）生成一颗流星
    function spawnMeteor() {
        if (meteors.length >= CONFIG.maxMeteors) return;

        const horizontal = Math.random() < 0.5;
        const color = pick(CONFIG.colors);
        const tail = rand(CONFIG.minTail, CONFIG.maxTail);
        const speed = rand(CONFIG.minSpeed, CONFIG.maxSpeed);
        const dir = Math.random() < 0.5 ? 1 : -1; // 飞行方向

        const m = { horizontal, color, tail, speed, born: performance.now() };

        if (horizontal) {
            // 水平线：y 对齐网格，x 从一侧边缘飞入、另一侧飞出
            const y = Math.round(rand(0, H) / CONFIG.grid) * CONFIG.grid;
            m.y = y;
            m.startX = dir > 0 ? -tail : W + tail;
            m.endX = dir > 0 ? W + tail : -tail;
            m.dx = dir; m.dy = 0;
        } else {
            // 垂直线：x 对齐网格，y 从一侧边缘飞入、另一侧飞出
            const x = Math.round(rand(0, W) / CONFIG.grid) * CONFIG.grid;
            m.x = x;
            m.startY = dir > 0 ? -tail : H + tail;
            m.endY = dir > 0 ? H + tail : -tail;
            m.dx = 0; m.dy = dir;
        }

        const dist = horizontal
            ? Math.abs(m.endX - m.startX)
            : Math.abs(m.endY - m.startY);
        m.duration = (dist / m.speed) * 1000;
        meteors.push(m);
    }

    function draw(now) {
        ctx.clearRect(0, 0, W, H);

        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            const p = (now - m.born) / m.duration;
            if (p >= 1) { meteors.splice(i, 1); continue; }

            // 头部位置
            let hx, hy;
            if (m.horizontal) {
                hx = m.startX + (m.endX - m.startX) * p;
                hy = m.y;
            } else {
                hx = m.x;
                hy = m.startY + (m.endY - m.startY) * p;
            }

            // 淡入 / 淡出过渡（前后各 12%）
            const fade = Math.min(p / 0.12, 1) * Math.min((1 - p) / 0.12, 1);
            const alpha = Math.max(0, Math.min(1, fade));

            // 尾巴末端（沿飞行反方向）
            const tailX = hx - m.dx * m.tail;
            const tailY = hy - m.dy * m.tail;
            const [r, g, b] = m.color;

            // 尾巴：线性渐变 头部全色 → 中段半透明 → 尾端消失
            const grad = ctx.createLinearGradient(hx, hy, tailX, tailY);
            grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
            grad.addColorStop(0.35, `rgba(${r},${g},${b},${alpha * 0.5})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            // 头部光晕 + 内核白点
            ctx.save();
            ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`;
            ctx.shadowBlur = 16;                 // 发光球体
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.beginPath();
            ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;                   // 内核白色亮点
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.arc(hx, hy, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 随机间隔生成
        if (now - lastSpawn > nextSpawn) {
            spawnMeteor();
            lastSpawn = now;
            nextSpawn = randInterval();
        }

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(draw);
})();

/* ========== 滚动渐显 · Intersection Observer ========== */
function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
}

/* ========== 移动端菜单交互 ========== */
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.getElementById('menuOverlay');

    if (!menuToggle || !navLinks || !overlay) return;

    function closeMenu() {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openMenu() {
        menuToggle.classList.add('active');
        navLinks.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navLinks.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    overlay.addEventListener('click', closeMenu);

    // 点击导航链接后自动关闭菜单
    const navItems = navLinks.querySelectorAll('a, button');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            closeMenu();
        });
    });

    // 窗口大小改变时，如果变成桌面视图且菜单打开，自动关闭
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            closeMenu();
        }
    });
}

/* 页面加载后自动初始化滚动渐显与移动端菜单 */
document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initMobileMenu();
});
