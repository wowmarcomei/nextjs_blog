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
5. **搜索功能**：支持全文搜索，包括文章标题、内容、标签和分类。
6. **响应式设计**：适配各种设备，提供良好的移动端体验。
7. **社交分享**：支持将文章分享到各大社交媒体平台。
8. **SEO 优化**：自动生成 meta 标签和 Open Graph 数据，优化搜索引擎收录。


## TO Be Done

1. 配置抽象化至config.yaml
2. Sidebar固定
3. Menu优化
4. 文章页添加目录
5. 添加Project项目页，卡片模式

## 开始使用

1. 克隆仓库：

   ```
   git clone https://github.com/wowmarcomei/nextjs_blog.git
   ```
2. 安装依赖：

   ```
   npm install
   ```
3. 运行开发服务器：

   ```
   npm run dev
   ```
4. 在浏览器中打开 `http://localhost:3000` 查看博客。

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
