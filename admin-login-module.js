// ================================================================
// 管理员登录模块 - 动态加载
// ================================================================

(function() {
    // 检查是否已经渲染过
    if (document.getElementById('adminLoginContent')) {
        return;
    }

    // Supabase 配置（复用主页面配置）
    const SUPABASE_URL = 'https://zsyswamtmhqitsqbolut.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_lkwHgCi9HYVKgHxVTw_7UQ_U5PRng_W';
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 渲染管理员登录界面
    const overlay = document.getElementById('adminOverlay');
    if (!overlay) {
        console.error('找不到管理员登录容器');
        return;
    }

    overlay.innerHTML = `
        <div id="adminLoginContent" style="
            background: white;
            border-radius: 16px;
            padding: 36px 32px 32px;
            width: 380px;
            max-width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            position: relative;
            animation: adminFadeIn 0.25s ease;
        ">
            <style>
                @keyframes adminFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .admin-close-btn {
                    position: absolute;
                    top: 12px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 22px;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .admin-close-btn:hover { color: #dc2626; }
                .admin-icon {
                    width: 52px; height: 52px;
                    border-radius: 50%;
                    background: #EEF2FF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 26px;
                    margin: 0 auto 12px;
                }
                .admin-title { font-size: 20px; font-weight: 700; color: #1e293b; text-align: center; }
                .admin-sub { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 20px; }
                .admin-input {
                    width: 100%;
                    padding: 11px 14px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 14px;
                    margin-bottom: 14px;
                    box-sizing: border-box;
                    outline: none;
                    transition: border 0.2s;
                }
                .admin-input:focus {
                    border-color: #4F46E5;
                    box-shadow: 0 0 0 3px rgba(79,70,229,0.08);
                }
                .admin-btn {
                    width: 100%;
                    padding: 12px;
                    background: #4F46E5;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .admin-btn:hover { background: #4338CA; }
                .admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .admin-error {
                    color: #dc2626;
                    font-size: 13px;
                    margin-top: 10px;
                    text-align: center;
                    min-height: 20px;
                }
                .admin-hint {
                    font-size: 12px;
                    color: #94a3b8;
                    text-align: center;
                    margin-top: 12px;
                }
            </style>

            <button class="admin-close-btn" id="adminCloseBtn" title="关闭">✕</button>
            
            <div class="admin-icon">🛡️</div>
            <div class="admin-title">管理员登录</div>
            <div class="admin-sub">仅限授权管理员访问</div>

            <input type="email" id="adminEmail" class="admin-input" placeholder="管理员邮箱" autocomplete="off">
            <input type="password" id="adminPassword" class="admin-input" placeholder="密码" autocomplete="off">

            <button class="admin-btn" id="adminLoginBtn">登 录</button>

            <div class="admin-error" id="adminError"></div>
            <div class="admin-hint">💡 连续按 5 次 Shift 可打开/关闭此窗口</div>
        </div>
    `;

    // ============================================================
    // 事件绑定
    // ============================================================

    // 关闭按钮
    const closeBtn = document.getElementById('adminCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const overlay = document.getElementById('adminOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        });
    }

    // ESC 键关闭
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('adminOverlay');
            if (overlay && overlay.style.display === 'flex') {
                overlay.style.display = 'none';
                document.removeEventListener('keydown', escHandler);
            }
        }
    });

    // 登录按钮
    const loginBtn = document.getElementById('adminLoginBtn');
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    const errorEl = document.getElementById('adminError');

    if (loginBtn) {
        loginBtn.addEventListener('click', adminLoginHandler);
    }

    // 回车键登录
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const overlay = document.getElementById('adminOverlay');
            if (overlay && overlay.style.display === 'flex') {
                const active = document.activeElement;
                if (active && (active.id === 'adminEmail' || active.id === 'adminPassword')) {
                    e.preventDefault();
                    adminLoginHandler();
                }
            }
        }
    });

    // ============================================================
    // 管理员登录逻辑
    // ============================================================
    async function adminLoginHandler() {
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            if (errorEl) errorEl.textContent = '请填写邮箱和密码';
            return;
        }

        if (errorEl) errorEl.textContent = '';
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';
        }

        try {
            const result = await supabaseClient.auth.signInWithPassword({ email, password });
            if (result.error) throw result.error;

            // 检查是否为管理员
            const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('role, status')
                .eq('id', result.data.user.id)
                .single();

            if (profileError || !profile) {
                throw new Error('用户信息异常');
            }

            if (profile.role !== 'admin') {
                await supabaseClient.auth.signOut();
                throw new Error('您没有管理员权限');
            }

            if (profile.status === 'disabled' || profile.status === 'banned') {
                await supabaseClient.auth.signOut();
                throw new Error('账号已被禁用');
            }

            // 登录成功，跳转管理后台
            window.location.href = 'admin-dashboard.html';

        } catch (err) {
            if (errorEl) {
                let msg = err.message;
                if (msg === 'Invalid login credentials') {
                    msg = '邮箱或密码错误';
                }
                errorEl.textContent = msg;
            }
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = '登 录';
            }
        }
    }
})();