const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const config = { 
    baseUrl: process.env.NODE_ENV === 'production' ? '/Static-Site' : '' 
}; 

// Configure marked to handle the frontmatter
marked.use({
    extensions: [{
        name: 'frontmatter',
        level: 'block',
        start(src) {
            return src.match(/^---\n/)?.index;
        },
        tokenizer(src) {
            const match = src.match(/^---\n([\s\S]*?)\n---\n/);
            if (match) {
                return {
                    type: 'frontmatter',
                    raw: match[0],
                    text: match[1],
                };
            }
        },
        renderer(token) {
            return ''; // Return empty string to remove frontmatter from output
        }
    }]
});

// Ensure build directories exist
fs.ensureDirSync(path.join(__dirname, '../public'));
fs.ensureDirSync(path.join(__dirname, '../src/content/pages'));
fs.ensureDirSync(path.join(__dirname, '../src/content/blog'));
fs.ensureDirSync(path.join(__dirname, '../src/templates'));
fs.ensureDirSync(path.join(__dirname, '../src/styles'));
fs.ensureDirSync(path.join(__dirname, '../src/scripts'));
fs.ensureDirSync(path.join(__dirname, '../public/blog'));
fs.ensureDirSync(path.join(__dirname, '../public/images'));

// Read the template file
function getTemplate() {
    const templatePath = path.join(__dirname, '../src/templates/base.html');
    return fs.readFileSync(templatePath, 'utf-8');
}

// Read the blog template
function getBlogTemplate() {
    const templatePath = path.join(__dirname, '../src/templates/blog.html');
    return fs.readFileSync(templatePath, 'utf-8');
}

// Read the blog list template
function getBlogListTemplate() {
    const templatePath = path.join(__dirname, '../src/templates/blog-list.html');
    if (!fs.existsSync(templatePath)) {
        console.error('Blog list template not found:', templatePath);
        throw new Error('Blog list template not found');
    }
    return fs.readFileSync(templatePath, 'utf-8');
}

// Convert markdown to HTML and inject into template
function processMarkdown(markdown, template, title) {
    const htmlContent = marked.parse(markdown);
    return template
        .replace('{{title}}', title)
        .replace('{{content}}', htmlContent);
}

// Process blog post frontmatter
function processFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) return { metadata: {}, content };
    
    const frontmatter = match[1];
    const actualContent = match[2].trim();
    
    const metadata = {};
    frontmatter.split('\n').forEach(line => {
        const [key, value] = line.split(': ');
        if (key && value) {
            metadata[key.trim()] = value.replace(/^"|"$/g, '').trim();
        }
    });
    
    return { metadata, content: actualContent };
}

// Updated transform function that only adds prefix in production
function transformHtml(content) {
    if (process.env.NODE_ENV !== 'production') {
        return content;
    }
    
    // First remove any duplicate baseUrl prefixes that might exist
    while (content.includes(config.baseUrl + config.baseUrl)) {
        content = content.replace(config.baseUrl + config.baseUrl, config.baseUrl);
    }
    
    // Handle blog post URLs in the listing
    content = content.replace(
        /href="\/blog\/([^"]+)"/g,
        (match, path) => {
            // Don't modify if already has baseUrl
            if (match.includes(config.baseUrl)) {
                return match;
            }
            return `href="${config.baseUrl}/blog/${path}"`;
        }
    );
    
    // Handle all root-relative URLs (href and src attributes)
    content = content.replace(
        /(href|src)="\/([^"]*?)"/g,
        (match, attr, path) => {
            // Don't modify if it's already prefixed or is an absolute URL
            if (path.startsWith('http') || path.startsWith(config.baseUrl.substring(1))) {
                return match;
            }
            return `${attr}="${config.baseUrl}/${path}"`;
        }
    );
    
    return content;
}

async function build() {
    // Clean the public directory first
    await fs.emptyDir(path.join(__dirname, '../public'));
    
    // Copy static assets first
    await fs.copy(
        path.join(__dirname, '../src/styles'), 
        path.join(__dirname, '../public/styles')
    );
    await fs.copy(
        path.join(__dirname, '../src/images'), 
        path.join(__dirname, '../public/images')
    );
    
    // Process HTML files
    async function processHtmlFile(src, dest) {
        const content = await fs.readFile(src, 'utf-8');
        const transformedContent = transformHtml(content);
        await fs.outputFile(dest, transformedContent);
    }

    // Copy and transform index.html
    await processHtmlFile(
        path.join(__dirname, '../src/index.html'),
        path.join(__dirname, '../public/index.html')
    );

    // Process markdown pages
    const pagesDir = path.join(__dirname, '../src/content/pages');
    const pageFiles = fs.readdirSync(pagesDir);

    for (const file of pageFiles) {
        const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
        const fileName = path.basename(file, '.md');
        const title = fileName.charAt(0).toUpperCase() + fileName.slice(1);
        
        const html = processMarkdown(content, getTemplate(), title);
        const transformedHtml = transformHtml(html);
        
        fs.writeFileSync(
            path.join(__dirname, '../public', `${fileName}.html`),
            transformedHtml
        );
    }
    
    // Process blog posts
    const blogDir = path.join(__dirname, '../src/content/blog');
    const blogFiles = fs.readdirSync(blogDir);
    
    // Create blog output directory
    const blogOutputDir = path.join(__dirname, '../public/blog');
    fs.ensureDirSync(blogOutputDir);

    // Collect blog post data for the listing page
    const blogPosts = [];

    for (const file of blogFiles) {
        const filePath = path.join(blogDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Process frontmatter and content
        const { metadata, content: postContent } = processFrontmatter(content);
        const htmlContent = marked.parse(postContent);
        
        // Store blog post data
        const fileName = path.basename(file, '.md');
        const title = metadata.title || fileName.replace(/-/g, ' ');
        
        blogPosts.push({
            title: title,
            date: metadata.date || '',
            url: `/blog/${fileName}.html`  // Keep it simple, transformHtml will handle the prefix
        });
        
        // Generate individual blog post pages
        let html = getBlogTemplate()
            .replace(/\{\{title\}\}/g, title)
            .replace(/\{\{date\}\}/g, metadata.date || '')
            .replace('{{content}}', htmlContent);
        
        const transformedHtml = transformHtml(html);
        const outputPath = path.join(blogOutputDir, `${fileName}.html`);
        fs.writeFileSync(outputPath, transformedHtml);
    }

    // Generate blog listing page
    const blogListTemplate = getBlogListTemplate();
    const blogListContent = blogPosts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(post => `
            <div class="blog-post-preview">
                <h2><a href="${post.url}">${post.title}</a></h2>
                <div class="blog-post-meta">${post.date}</div>
            </div>
        `)
        .join('');

    const blogListHtml = blogListTemplate.replace('{{blog_posts}}', blogListContent);
    const transformedBlogListHtml = transformHtml(blogListHtml);
    fs.writeFileSync(path.join(__dirname, '../public/blog/index.html'), transformedBlogListHtml);
    
    console.log('Site built successfully!');
}

build().catch(console.error); 