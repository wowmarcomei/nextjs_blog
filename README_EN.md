# Next.js Blog System

This is a feature-rich blog system built with Next.js.

[中文版](./README.md)

## Features

1. **Article Management**: Support for creating and editing articles in Markdown format.

2. **Tags and Categories**: Articles can be tagged and categorized for easy organization and discovery.

3. **Related Article Recommendations**:
   - Recommendations based on article content similarity, tag matching, and category matching.
   - Considers article view count, with popular articles more likely to be recommended.
   - Supports customizable display quantity and lazy loading of more related articles.

4. **Article View Count Statistics**:
   - Real-time statistics and display of view count for each article.
   - View count data is used to optimize related article recommendations.

5. **Search Functionality**: 
   - Supports full-text search, including article titles, content, tags, and categories.
   - Integrated SearchBar component for easy access to search functionality.
   - Real-time search results display with clear search query indication.

6. **Responsive Design**: 
   - Adapts to various devices, providing excellent mobile and desktop experiences.
   - Optimized components (Hero, BlogPosts, RelatedPosts, Sidebar) for different screen sizes.
   - Implemented fluid layouts to ensure proper content display across all devices.
   - Improved width ratios for article lists and sidebar, providing a better reading experience.
   - Optimized article page layout, offering wider content area and narrower sidebar on desktop.

7. **Social Sharing**: Support for sharing articles to major social media platforms.

8. **SEO Optimization**: 
   - Automatically generates meta tags and Open Graph data to optimize search engine indexing.
   - Enhanced metadata including Twitter Card tags for better social media sharing.

9. **User Experience Enhancements**:
   - Implemented a ScrollToTopButton for easy navigation on long pages.
   - Added a LoadingSpinner component for better visual feedback during content loading.
   - Improved pagination system with responsive design.
   - Optimized sidebar layout for better reading experience across different screen sizes.
   - Implemented infinite scrolling for smooth article browsing experience.

10. **Performance Optimization**:
    - Optimized image rendering using fixed aspect ratio containers and object-fit property, resolving size warnings and improving page load performance.
    - Implemented efficient lazy loading for related posts.
    - Enhanced component rendering for faster page load times.
    - Improved infinite scrolling implementation, reducing layout shifts when loading new content.

11. **Enhanced Layout and Styling**:
    - Added a Hero component to the homepage for a more engaging user interface.
    - Updated Tailwind configuration to support custom animations.
    - Improved article list and sidebar layout for a better reading experience.
    - Optimized tag and category display for better presentation on smaller screens.
    - Adjusted article page layout ratios for wider content display on desktop, enhancing readability.

## To Be Done

1. Abstract configuration to config.yaml
2. Fixed sidebar
3. Menu optimization
4. Add table of contents to article pages
5. Add Project page with card layout

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/wowmarcomei/nextjs_blog.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser to view the blog.

## Building and Deployment

1. Build the project:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)