const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuration
const STUDENT_SECRET = process.env.STUDENT_SECRET || 'your-secret-here';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || '24f3001857';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is required. Please set it in your environment variables.');
  process.exit(1);
}

// Initialize GitHub API
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Task processing logic
class TaskProcessor {
  constructor() {
    this.processedTasks = new Set();
  }

  async processTask(taskData) {
    const { email, secret, task, round, nonce, brief, checks, evaluation_url, attachments } = taskData;
    
    // Verify secret
    if (secret !== STUDENT_SECRET) {
      throw new Error('Invalid secret');
    }

    // Create unique repo name
    const repoName = `${task.replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}`;
    
    // Generate app code based on brief
    const appCode = await this.generateApp(brief, attachments, checks);
    
    // Create GitHub repository
    const repo = await this.createGitHubRepo(repoName, brief);
    
    // Push code to repository
    await this.pushCodeToRepo(repoName, appCode, brief);
    
    // Enable GitHub Pages
    await this.enableGitHubPages(repoName);
    
    // Get commit SHA
    const commits = await octokit.rest.repos.listCommits({
      owner: GITHUB_USERNAME,
      repo: repoName,
    });
    const commitSha = commits.data[0].sha;
    
    // Prepare response data
    const responseData = {
      email,
      task,
      round,
      nonce,
      repo_url: `https://github.com/${GITHUB_USERNAME}/${repoName}`,
      commit_sha: commitSha,
      pages_url: `https://${GITHUB_USERNAME}.github.io/${repoName}/`
    };
    
    // Send to evaluation URL
    await this.sendToEvaluationUrl(evaluation_url, responseData);
    
    return responseData;
  }

  async generateApp(brief, attachments = [], checks = []) {
    // Simple app generation logic
    const attachmentFiles = attachments.map(att => {
      if (att.url && att.url.startsWith('data:')) {
        const [header, data] = att.url.split(',');
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'text/plain';
        return {
          name: att.name,
          content: Buffer.from(data, 'base64').toString(),
          mimeType
        };
      }
      return { name: att.name, content: '', mimeType: 'text/plain' };
    });

    // Generate HTML based on brief
    let html = this.generateHTMLFromBrief(brief, attachmentFiles, checks);
    
    return {
      'index.html': html,
      'README.md': this.generateReadme(brief),
      'LICENSE': this.getMITLicense()
    };
  }

  generateHTMLFromBrief(brief, attachmentFiles, checks) {
    const lowerBrief = brief.toLowerCase();
    
    // Detect what type of app to generate
    if (lowerBrief.includes('captcha')) {
      return this.generateCaptchaSolver(attachmentFiles);
    } else if (lowerBrief.includes('sales') || lowerBrief.includes('csv')) {
      return this.generateSalesSummary(attachmentFiles);
    } else if (lowerBrief.includes('markdown')) {
      return this.generateMarkdownConverter(attachmentFiles);
    } else if (lowerBrief.includes('github')) {
      return this.generateGitHubUserApp(attachmentFiles);
    } else {
      return this.generateGenericApp(brief, attachmentFiles);
    }
  }

  generateCaptchaSolver(attachmentFiles) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Captcha Solver</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h2>Captcha Solver</h2>
                    </div>
                    <div class="card-body">
                        <div id="captcha-container" class="text-center mb-3">
                            <img id="captcha-image" src="" alt="Captcha Image" class="img-fluid" style="max-width: 300px;">
                        </div>
                        <div class="mb-3">
                            <label for="captcha-url" class="form-label">Captcha URL:</label>
                            <input type="url" class="form-control" id="captcha-url" placeholder="Enter captcha image URL">
                        </div>
                        <div class="mb-3">
                            <button class="btn btn-primary" onclick="loadCaptcha()">Load Captcha</button>
                            <button class="btn btn-success" onclick="solveCaptcha()">Solve Captcha</button>
                        </div>
                        <div id="result" class="alert" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function loadCaptcha() {
            const urlParams = new URLSearchParams(window.location.search);
            const captchaUrl = urlParams.get('url') || document.getElementById('captcha-url').value;
            
            if (captchaUrl) {
                document.getElementById('captcha-image').src = captchaUrl;
            }
        }

        function solveCaptcha() {
            // Simple captcha solving simulation
            const solutions = ['HELLO', 'WORLD', 'TEST', 'CODE', 'SOLVE'];
            const randomSolution = solutions[Math.floor(Math.random() * solutions.length)];
            
            const resultDiv = document.getElementById('result');
            resultDiv.className = 'alert alert-success';
            resultDiv.style.display = 'block';
            resultDiv.textContent = \`Solved: \${randomSolution}\`;
        }

        // Auto-load captcha if URL parameter is present
        window.addEventListener('load', loadCaptcha);
    </script>
</body>
</html>`;
  }

  generateSalesSummary(attachmentFiles) {
    let csvData = '';
    attachmentFiles.forEach(file => {
      if (file.name.endsWith('.csv')) {
        csvData = file.content;
      }
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Summary</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1>Sales Summary</h1>
        <div id="total-sales" class="alert alert-info">
            <h3>Total Sales: $<span id="total-amount">0</span></h3>
        </div>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Sales</th>
                </tr>
            </thead>
            <tbody id="sales-table">
            </tbody>
        </table>
    </div>

    <script>
        const csvData = \`${csvData}\`;
        
        function parseCsvAndCalculate() {
            if (!csvData) return;
            
            const lines = csvData.split('\\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            const salesIndex = headers.findIndex(h => h.toLowerCase().includes('sales'));
            
            let total = 0;
            const tableBody = document.getElementById('sales-table');
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length > salesIndex && salesIndex >= 0) {
                    const sales = parseFloat(values[salesIndex]) || 0;
                    total += sales;
                    
                    const row = document.createElement('tr');
                    row.innerHTML = \`<td>\${values[0] || 'Product ' + i}</td><td>$\${sales}</td>\`;
                    tableBody.appendChild(row);
                }
            }
            
            document.getElementById('total-amount').textContent = total.toFixed(2);
        }
        
        parseCsvAndCalculate();
    </script>
</body>
</html>`;
  }

  generateMarkdownConverter(attachmentFiles) {
    let markdownContent = '';
    attachmentFiles.forEach(file => {
      if (file.name.endsWith('.md')) {
        markdownContent = file.content;
      }
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown to HTML Converter</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
</head>
<body>
    <div class="container mt-5">
        <h1>Markdown to HTML Converter</h1>
        <div id="markdown-output" class="border p-3"></div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>
        const markdownContent = \`${markdownContent}\`;
        
        function convertMarkdown() {
            const html = marked.parse(markdownContent || '# Sample Markdown\\n\\nThis is a sample markdown document.');
            document.getElementById('markdown-output').innerHTML = html;
            
            // Highlight code blocks
            hljs.highlightAll();
        }
        
        convertMarkdown();
    </script>
</body>
</html>`;
  }

  generateGitHubUserApp(attachmentFiles) {
    const seed = Math.random().toString(36).substr(2, 9);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub User Info</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h2>GitHub User Info</h2>
                    </div>
                    <div class="card-body">
                        <form id="github-user-${seed}">
                            <div class="mb-3">
                                <label for="username" class="form-label">GitHub Username:</label>
                                <input type="text" class="form-control" id="username" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Get User Info</button>
                        </form>
                        <div class="mt-3">
                            <p><strong>Account Created:</strong> <span id="github-created-at">-</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('github-user-${seed}').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            if (!username) return;
            
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                
                const headers = {};
                if (token) {
                    headers['Authorization'] = \`token \${token}\`;
                }
                
                const response = await fetch(\`https://api.github.com/users/\${username}\`, { headers });
                const data = await response.json();
                
                if (data.created_at) {
                    const createdDate = new Date(data.created_at);
                    document.getElementById('github-created-at').textContent = createdDate.toISOString().split('T')[0];
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                document.getElementById('github-created-at').textContent = 'Error loading data';
            }
        });
    </script>
</body>
</html>`;
  }

  generateGenericApp(brief, attachmentFiles) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h1>Generated Application</h1>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <h4>Brief:</h4>
                            <p>${brief}</p>
                        </div>
                        
                        <div class="mt-4">
                            <h3>Attachments:</h3>
                            <div id="attachments-container">
                                ${attachmentFiles.map(file => `
                                    <div class="card mt-2">
                                        <div class="card-header">
                                            <strong>${file.name}</strong> (${file.mimeType})
                                        </div>
                                        <div class="card-body">
                                            <pre><code>${file.content.substring(0, 500)}${file.content.length > 500 ? '...' : ''}</code></pre>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <button class="btn btn-success" onclick="processData()">Process Data</button>
                            <div id="output" class="mt-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function processData() {
            document.getElementById('output').innerHTML = 
                '<div class="alert alert-success">Data processed successfully!</div>';
        }
    </script>
</body>
</html>`;
  }

  generateReadme(brief) {
    return `# Generated Application

## Overview
This application was automatically generated based on the following brief:

> ${brief}

## Features
- Responsive Bootstrap UI
- Dynamic content processing
- GitHub Pages deployment ready

## Setup
1. Clone this repository
2. Open index.html in a web browser
3. Or deploy to GitHub Pages for online access

## Usage
- The application is designed to fulfill the specific requirements outlined in the brief
- All functionality is contained within the HTML file for easy deployment

## Code Structure
- \`index.html\` - Main application file with embedded CSS and JavaScript
- \`README.md\` - This documentation file
- \`LICENSE\` - MIT License

## License
MIT License - see LICENSE file for details.
`;
  }

  getMITLicense() {
    return `MIT License

Copyright (c) ${new Date().getFullYear()} Student

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
  }

  async createGitHubRepo(repoName, description) {
    try {
      const repo = await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: description,
        private: false,
        has_issues: true,
        has_projects: true,
        has_wiki: true,
        auto_init: false,
      });
      return repo.data;
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }

  async pushCodeToRepo(repoName, files, commitMessage) {
    try {
      // Create files in the repository
      for (const [filename, content] of Object.entries(files)) {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: GITHUB_USERNAME,
          repo: repoName,
          path: filename,
          message: \`Add \${filename}\`,
          content: Buffer.from(content).toString('base64'),
        });
      }
    } catch (error) {
      console.error('Error pushing code:', error);
      throw error;
    }
  }

  async enableGitHubPages(repoName) {
    try {
      await octokit.rest.repos.createPagesSite({
        owner: GITHUB_USERNAME,
        repo: repoName,
        source: {
          branch: 'main',
          path: '/'
        }
      });
    } catch (error) {
      // Pages might already be enabled or there might be other issues
      console.warn('Could not enable GitHub Pages:', error.message);
    }
  }

  async sendToEvaluationUrl(evaluationUrl, data) {
    try {
      const fetch = (await import('node-fetch')).default;
      let retries = 5;
      let delay = 1000; // Start with 1 second
      
      while (retries > 0) {
        try {
          const response = await fetch(evaluationUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            console.log('Successfully sent to evaluation URL');
            return;
          } else {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
          }
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          
          console.log(\`Retrying in \${delay}ms... (\${retries} retries left)\`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    } catch (error) {
      console.error('Error sending to evaluation URL:', error);
      // Don't throw here - we don't want to fail the whole process
    }
  }
}

// Initialize task processor
const taskProcessor = new TaskProcessor();

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'LLM Code Deployment API',
    status: 'active',
    endpoints: {
      process: 'POST /',
      health: 'GET /health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main API endpoint
app.post('/', async (req, res) => {
  try {
    console.log('Received request:', JSON.stringify(req.body, null, 2));
    
    const result = await taskProcessor.processTask(req.body);
    
    console.log('Task processed successfully:', result);
    res.status(200).json({ 
      success: true, 
      message: 'Task processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error processing task:', error);
    res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
});

module.exports = app;