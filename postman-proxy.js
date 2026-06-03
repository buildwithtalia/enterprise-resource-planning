#!/usr/bin/env node

/**
 * Postman Insights Proxy
 *
 * This proxy server forwards requests from localhost:3004 to the Kubernetes service
 * where the Postman insights agent can capture them.
 *
 * Usage: node postman-proxy.js
 */

const http = require('http');
const https = require('https');
const url = require('url');

const LOCAL_PORT = 3004;
const TARGET_HOST = 'localhost';  // Kubernetes service host
const TARGET_PORT = 80;           // Kubernetes service port

console.log('🚀 Starting Postman Insights Proxy...');
console.log(`📡 Listening on: http://localhost:${LOCAL_PORT}`);
console.log(`🎯 Forwarding to: http://${TARGET_HOST}:${TARGET_PORT}`);
console.log('📊 All traffic will be captured by Postman Insights Agent');
console.log('');

const server = http.createServer((req, res) => {
    // Log incoming request
    console.log(`📥 ${req.method} ${req.url}`);

    // Parse the request URL
    const parsedUrl = url.parse(req.url, true);

    // Build target URL
    const targetUrl = `http://${TARGET_HOST}:${TARGET_PORT}${req.url}`;

    // Parse target URL for http.request
    const targetParsed = url.parse(targetUrl);

    // Prepare request options
    const options = {
        hostname: targetParsed.hostname,
        port: targetParsed.port,
        path: targetParsed.path,
        method: req.method,
        headers: {
            ...req.headers,
            'host': `${TARGET_HOST}:${TARGET_PORT}`, // Override host header
        }
    };

    // Create request to target
    const proxyReq = http.request(options, (proxyRes) => {
        // Copy status and headers from target response
        res.statusCode = proxyRes.statusCode;
        res.statusMessage = proxyRes.statusMessage;

        // Copy headers
        Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
        });

        // Log response status
        console.log(`📤 ${proxyRes.statusCode} ${req.method} ${req.url}`);

        // Pipe response data
        proxyRes.pipe(res);
    });

    // Handle proxy request errors
    proxyReq.on('error', (err) => {
        console.error(`❌ Proxy Error for ${req.method} ${req.url}:`, err.message);

        if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Bad Gateway',
                message: 'Failed to connect to target service',
                details: err.message
            }));
        }
    });

    // Handle client request errors
    req.on('error', (err) => {
        console.error(`❌ Request Error:`, err.message);
    });

    // Pipe request data to target
    req.pipe(proxyReq);
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${LOCAL_PORT} is already in use.`);
        console.error('Please stop the existing process or choose a different port.');
        process.exit(1);
    } else {
        console.error('❌ Server Error:', err.message);
    }
});

// Start the server
server.listen(LOCAL_PORT, '127.0.0.1', () => {
    console.log('✅ Proxy server is running!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Run your Postman collection requests');
    console.log('  2. Check Postman Insights dashboard for captured API calls');
    console.log('  3. Press Ctrl+C to stop the proxy');
    console.log('');
    console.log(`🔗 Postman Insights Dashboard: https://go.postman.co/insights/project/svc_36jDNeS6qVkHzGtYyF4oBd`);
    console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('📴 Stopping Postman Insights Proxy...');
    server.close(() => {
        console.log('✅ Proxy stopped successfully!');
        process.exit(0);
    });
});