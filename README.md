# LLM Code Deployment System

An automated system that receives task briefs, generates web applications using AI, and deploys them to GitHub Pages.

## Overview

This project implements a comprehensive LLM-powered code deployment system that:
1. **Receives** JSON task requests via API endpoint
2. **Verifies** student secrets for authentication
3. **Generates** web applications based on natural language briefs
4. **Creates** GitHub repositories automatically
5. **Deploys** to GitHub Pages for live hosting
6. **Evaluates** and submits results to evaluation endpoints

## Quick Start

### For Form Submission
You'll need these values:
- **API URL**: Your deployed Vercel endpoint (e.g., https://your-app.vercel.app/)
- **Secret**: `llm-deployment-secret-2024`
- **GitHub repo**: `https://github.com/24f3001857/tset`

### Deployment to Vercel
1. Deploy this repo to Vercel
2. Set environment variables in Vercel dashboard:
   - `STUDENT_SECRET=llm-deployment-secret-2024`
   - `GITHUB_TOKEN=your-github-token`
   - `GITHUB_USERNAME=24f3001857`
3. Your API will be available at the Vercel URL

## Features

### Supported Application Types
- **Captcha Solvers**: Image processing and text recognition interfaces
- **Sales Dashboards**: CSV data processing and visualization
- **Markdown Converters**: Real-time markdown to HTML conversion
- **GitHub User Tools**: API integration for user information retrieval
- **Generic Applications**: Flexible templates for custom requirements

### Technical Capabilities
- Express.js API server with CORS support
- GitHub API integration using Octokit
- Automatic repository creation and file management
- GitHub Pages deployment automation
- Retry logic with exponential backoff
- Environment variable configuration
- Professional error handling and logging

## License

MIT License - see [LICENSE](LICENSE) file for details.
