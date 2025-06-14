# AI Image Studio - fal.ai Web UI

一个功能强大、界面精美的AI图像生成Web应用，基于fal.ai API构建，支持多种顶级AI模型。

![AI Image Studio](./public/hippo.png)

## ✨ 主要特性

### 🏆 顶级AI模型支持
- **FLUX.1 Kontext [pro]** - 革命性指令式编辑
- **Google Imagen 4** - Google最新AI图像生成技术
- **Recraft V3** - ELO基准测试冠军
- **FLUX系列** - 包括dev、schnell、realism等多个版本
- **Stable Diffusion 3.5** - 最新SD模型

### 📱 完美移动端体验
- 响应式设计，完美适配手机和平板
- 触摸优化的界面元素
- 智能面板切换 (Generate → Image → Gallery)
- 流畅的动画和过渡效果

### 🎨 强大的功能
- **实时进度显示** - 可视化生成进度
- **图片编辑** - 基于Kontext模型的智能编辑
- **批量生成** - 一次生成多张图片
- **自定义参数** - 详细的模型参数调节
- **图片下载** - 一键下载生成的图片
- **历史记录** - 图片库管理

### 🔒 安全认证
- 密码保护访问
- 环境变量配置
- 安全的API密钥管理

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/ai-image-studio.git
cd ai-image-studio
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 3. 环境配置
创建 `.env.local` 文件：
```bash
# fal.ai API密钥 (必需)
FAL_KEY=your_fal_ai_api_key_here

# 应用访问密码 (可选，默认: 123456)
APP_PASSWORD=your_password_here
```

### 4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用！

## 🌐 Vercel部署

### 1. 部署到Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-image-studio)

### 2. 配置环境变量
在Vercel Dashboard中设置以下环境变量：
- `FAL_KEY`: 你的fal.ai API密钥
- `APP_PASSWORD`: 应用访问密码

### 3. 重新部署
设置环境变量后，触发重新部署以使配置生效。

## 🔧 配置说明

### FAL_KEY获取
1. 访问 [fal.ai](https://fal.ai/dashboard/keys)
2. 注册账户并登录
3. 在Dashboard中生成API密钥
4. 将密钥添加到环境变量中

### 支持的模型
| 模型 | 价格 | 特点 | 速度 |
|------|------|------|------|
| FLUX.1 Kontext [pro] | $0.04/MP | 指令式编辑 | 1-4s |
| Google Imagen 4 | $0.04/MP | Google最新技术 | 2-5s |
| Recraft V3 | $0.04/MP | ELO冠军 | 2-4s |
| FLUX.1 [dev] | $0.025/MP | 开源版本 | 3-6s |
| FLUX.1 [schnell] | $0.003/MP | 极速版本 | 0.6s |

## 📱 移动端功能

### 智能导航
- **Generate**: 图片生成界面
- **Image**: 当前生成的图片
- **Gallery**: 历史图片库

### 触摸优化
- 最小44px触摸目标
- 手势友好的界面
- 自适应键盘

## 🛠️ 技术栈

- **前端**: Next.js 14, React 18, Tailwind CSS
- **后端**: Next.js API Routes
- **AI服务**: fal.ai API
- **部署**: Vercel
- **图标**: Font Awesome
- **样式**: Apple风格设计系统

## 📁 项目结构

```
ai-image-studio/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.js          # 根布局
│   ├── page.js            # 主页面
│   └── login/             # 登录页面
├── components/            # React组件
│   ├── ImageEditor.js     # 图片编辑器
│   ├── ModelSelector.js   # 模型选择器
│   ├── MobileNavigation.js # 移动端导航
│   └── ...
├── pages/api/             # API路由
│   ├── generateImage.js   # 图片生成API
│   ├── login.js           # 登录API
│   └── ...
├── public/                # 静态资源
│   └── outputs/           # 生成的图片
└── ...
```

## 🔍 故障排除

### 常见问题

#### 1. 生成失败 - API密钥错误
**症状**: 点击生成后进度条消失，显示API密钥错误
**解决方案**:
- 检查 `FAL_KEY` 环境变量是否正确设置
- 确认API密钥有效且有足够配额
- 在Vercel中重新部署项目

#### 2. 图片无法显示
**症状**: 生成成功但图片不显示
**解决方案**:
- Vercel环境下图片会以base64格式返回
- 检查浏览器控制台是否有错误
- 确认网络连接正常

#### 3. 移动端显示异常
**症状**: 移动端界面错乱
**解决方案**:
- 清除浏览器缓存
- 检查CSS是否正确加载
- 确认viewport设置正确

### 调试工具
访问 `/debug` 页面进行环境检查和API测试。

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [fal.ai](https://fal.ai) - 提供强大的AI模型API
- [Next.js](https://nextjs.org) - 优秀的React框架
- [Tailwind CSS](https://tailwindcss.com) - 实用的CSS框架
- [Font Awesome](https://fontawesome.com) - 精美的图标库

## 📞 支持

如果你觉得这个项目有用，请给它一个⭐️！

有问题或建议？欢迎：
- 提交 [Issue](https://github.com/your-username/ai-image-studio/issues)
- 发送邮件到 your-email@example.com
- 在 [Twitter](https://twitter.com/your-handle) 上联系我们

---

**AI Image Studio** - 让AI图像生成变得简单而强大 ✨