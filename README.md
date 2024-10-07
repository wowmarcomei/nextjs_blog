# Next.js 博客系统

这是一个使用 Next.js 构建的功能丰富的博客系统。

[English Version](./README_EN.md)

## 功能

1. **文章管理**：支持 Markdown 格式的文章创建和编辑。
2. **标签和分类**：文章可以添加标签和分类，方便组织和查找。
3. **相关文章推荐**：
   - 基于文章内容相似度、标签匹配和分类匹配进行推荐。
   - 考虑文章阅读量，热门文章更容易被推荐。
   - 支持自定义显示数量和懒加载更多相关文章。
4. **文章阅读量统计**：
   - 实时统计和显示每篇文章的阅读量。
   - 阅读量数据用于优化相关文章推荐。
5. **搜索功能**：
   - 支持全文搜索，包括文章标题、内容、标签和分类。
   - 集成了 SearchBar 组件，方便用户快速访问搜索功能。
   - 实时显示搜索结果，并清晰标示搜索查询。
6. **响应式设计**：
   - 适配各种设备，提供卓越的移动端和桌面端体验。
   - 优化了组件（Hero、BlogPosts、RelatedPosts、Sidebar）以适应不同屏幕尺寸。
   - 实现了流式布局，确保内容在各种设备上都能正确显示。
   - 改进了文章列表和侧边栏的宽度比例，提供更佳的阅读体验。
   - 优化了文章页面布局，在桌面端提供更宽的文章内容区域和更窄的侧边栏。
7. **社交分享**：支持将文章分享到各大社交媒体平台。
8. **SEO 优化**：
   - 自动生成 meta 标签和 Open Graph 数据，优化搜索引擎收录。
   - 增强了元数据，包括 Twitter Card 标签，以改善社交媒体分享效果。
9. **用户体验增强**：
   - 实现了 ScrollToTopButton，方便长页面导航。
   - 添加了 LoadingSpinner 组件，在内容加载时提供更好的视觉反馈。
   - 改进了分页系统，采用响应式设计。
   - 优化了侧边栏布局，在不同屏幕尺寸下提供更好的阅读体验。
   - 实现了无限滚动功能，提供流畅的文章浏览体验。
10. **性能优化**：
    - 优化了图片渲染，使用固定宽高比容器和 object-fit 属性，解决了尺寸警告并提高了页面加载性能。
    - 为相关文章实现了高效的懒加载。
    - 优化了组件渲染，提高了页面加载速度。
    - 改进了无限滚动的实现，减少了加载新内容时的布局抖动。
11. **增强的布局和样式**：
    - 在首页添加了 Hero 组件，提供更吸引人的用户界面。
    - 更新了 Tailwind 配置以支持自定义动画。
    - 改进了文章列表和侧边栏的布局，提供更好的阅读体验。
    - 优化了标签和分类的显示方式，使其在较小屏幕上也能良好展示。
    - 调整了文章页面的布局比例，使文章内容在桌面端显示更宽，提升阅读体验。
12. **评论系统**：
    - 集成了 Giscus 评论系统，支持 GitHub 登录和评论。
    - 评论系统完全响应式，适配各种设备。
    - 支持深色模式，自动适应用户的主题设置。

## 待办事项

1. 添加 Project 项目页，卡片模式展示项目。

## 开始使用

1. 克隆仓库：
   ```
   git clone https://github.com/wowmarcomei/nextjs_blog.git
   ```
2. 安装依赖：
   ```
   npm install
   ```
3. 设置环境变量：
   创建一个 `.env.local` 文件，并添加以下内容：
   ```
   NEXT_PUBLIC_GISCUS_REPO=your-github-username/your-repo-name
   NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
   NEXT_PUBLIC_GISCUS_CATEGORY=your-category-name
   NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
   ```
4. 运行开发服务器：
   ```
   npm run dev
   ```
5. 在浏览器中打开 `http://localhost:3000` 查看博客。

## 构建和部署

1. 构建项目：
   ```
   npm run build
   ```
2. 启动生产服务器：
   ```
   npm start
   ```

## 贡献

欢迎提交 Pull Requests 来改进这个项目。对于重大变更，请先开 issue 讨论您想要改变的内容。

## 许可证

[MIT](https://choosealicense.com/licenses/mit/)
