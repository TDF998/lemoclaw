#!/usr/bin/env bash

# -------------------------------
# LemoClaw - OpenClaw 一键安装脚本
# 网站: https://lemoclaw.com
# 描述: 自动检测系统、安装依赖、部署 OpenClaw
# -------------------------------

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 打印 Logo
echo -e "${GREEN}"
echo "  _      _                      _      "
echo " | |    | |                    | |     "
echo " | |    | | ___  _ __ ___   ___| | __  "
echo " | |    | |/ _ \| '_ \` _ \ / _ \ |/ /  "
echo " | |____| | (_) | | | | | |  __/   <   "
echo " |______|_|\___/|_| |_| |_|\___|_|\_\  "
echo -e "            ${YELLOW}LemoClaw Installer${NC}"
echo "========================================"
echo

# 检测操作系统
detect_os() {
    info "检测操作系统..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command -v apt-get &> /dev/null; then
            PKG_MANAGER="apt"
        elif command -v yum &> /dev/null; then
            PKG_MANAGER="yum"
        else
            error "不支持的 Linux 发行版，请手动安装依赖"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        if ! command -v brew &> /dev/null; then
            error "未检测到 Homebrew，请先安装: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        fi
    else
        error "不支持的操作系统: $OSTYPE"
    fi
    success "操作系统: $OS"
}

# 安装系统依赖
install_deps() {
    info "安装系统依赖..."
    if [[ "$OS" == "linux" ]]; then
        if [[ "$PKG_MANAGER" == "apt" ]]; then
            sudo apt-get update
            sudo apt-get install -y git curl wget build-essential
        elif [[ "$PKG_MANAGER" == "yum" ]]; then
            sudo yum install -y git curl wget gcc gcc-c++ make
        fi
    elif [[ "$OS" == "macos" ]]; then
        brew install git curl wget
    fi
    success "系统依赖安装完成"
}

# 安装 Node.js (如果没有)
install_node() {
    if ! command -v node &> /dev/null; then
        info "安装 Node.js..."
        if [[ "$OS" == "linux" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [[ "$OS" == "macos" ]]; then
            brew install node@20
            brew link node@20
        fi
    else
        NODE_VERSION=$(node -v)
        success "Node.js 已安装: $NODE_VERSION"
    fi
}

# 克隆并安装 OpenClaw
install_openclaw() {
    info "克隆 OpenClaw 仓库..."
    cd ~
    if [ -d "openclaw" ]; then
        warn "检测到已存在 ~/openclaw 目录，将进行更新"
        cd openclaw
        git pull
    else
        git clone https://github.com/openclaw/openclaw.git
        cd openclaw
    fi

    info "安装 npm 依赖..."
    npm install

    info "构建项目..."
    npm run build

    success "OpenClaw 安装完成！"
}

# 主流程
main() {
    detect_os
    install_deps
    install_node
    install_openclaw

    echo
    success "🎉 OpenClaw 已成功部署！"
    echo
    info "下一步："
    echo "  1. 进入目录: cd ~/openclaw"
    echo "  2. 启动服务: npm start"
    echo "  3. 查看文档: https://lemoclaw.com/knowledge"
    echo
    # ============================================
# 处理插件参数（在脚本最后面添加）
# ============================================

PLUGIN=$1

if [ -n "$PLUGIN" ]; then
    echo
    info "检测到插件参数: $PLUGIN"
    
    # 创建插件目录
    mkdir -p ~/openclaw/plugins
    
    # 根据参数下载对应的插件配置
    case $PLUGIN in
        excel)
            info "正在配置 Excel 智能处理助手..."
            curl -fsSL https://raw.githubusercontent.com/TDF998/lemoclaw/main/plugins/excel-config.json -o ~/openclaw/plugins/excel.json
            success "Excel 插件配置已下载"
            ;;
        feishu)
            info "正在配置飞书消息推送器..."
            curl -fsSL https://raw.githubusercontent.com/TDF998/lemoclaw/main/plugins/feishu-config.json -o ~/openclaw/plugins/feishu.json
            success "飞书插件配置已下载"
            ;;
        ai-copywriter)
            info "正在配置 AI 文案创作工坊..."
            curl -fsSL https://raw.githubusercontent.com/TDF998/lemoclaw/main/plugins/ai-copywriter-config.json -o ~/openclaw/plugins/ai-copywriter.json
            success "AI文案插件配置已下载"
            ;;
        wechat)
            info "正在配置微信对话适配器..."
            curl -fsSL https://raw.githubusercontent.com/TDF998/lemoclaw/main/plugins/wechat-config.json -o ~/openclaw/plugins/wechat.json
            success "微信插件配置已下载"
            ;;
        web-scraper)
            info "正在配置网页内容抓取器..."
            curl -fsSL https://raw.githubusercontent.com/TDF998/lemoclaw/main/plugins/web-scraper-config.json -o ~/openclaw/plugins/web-scraper.json
            success "网页抓取器配置已下载"
            ;;
        dalle)
            info "正在配置 DALL·E 图片生成器..."
            curl -fsSL https://raw.githubusercontent.com/TDF998/lemoclaw/main/plugins/dalle-config.json -o ~/openclaw/plugins/dalle.json
            success "DALL·E 插件配置已下载"
            ;;
        douyin)
            info "正在配置抖音热点追踪..."
            curl -fsSL https://raw.githubusercontent.com/TDF998/lemoclaw/main/plugins/douyin-config.json -o ~/openclaw/plugins/douyin.json
            success "抖音插件配置已下载"
            ;;
        pdf-parser)
            info "正在配置 PDF 文档解析器..."
            curl -fsSL https://raw.githubusercontent.com/TDF998/lemoclaw/main/plugins/pdf-parser-config.json -o ~/openclaw/plugins/pdf-parser.json
            success "PDF 解析器配置已下载"
            ;;
        *)
            warn "未知插件: $PLUGIN，跳过插件配置"
            ;;
    esac
    
    echo
    info "插件配置文件已保存到: ~/openclaw/plugins/"
    echo "  请根据需要修改配置文件中的参数（如 API Key、webhook 地址等）"
    echo "  配置文件路径示例: nano ~/openclaw/plugins/feishu.json"
fi
    echo -e "${GREEN}✨ 需要一键配置技能？访问: https://lemoclaw.com/skills${NC}"
    echo
}

# 运行
main "$1"
