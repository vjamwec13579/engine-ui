#!/usr/bin/env python3
"""
Simple web dashboard for scheduler monitoring
Run with: python scheduler_dashboard.py
Then visit: http://localhost:5000
"""
from flask import Flask, jsonify, render_template_string
from scheduler_monitor import ExternalHealthChecker
from datetime import datetime
import json

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Iron Condor Scheduler Monitor</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .status-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .status-card.healthy {
            border-left-color: #28a745;
        }
        .status-card.unhealthy {
            border-left-color: #dc3545;
        }
        .status-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        .status-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #333;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-indicator.green {
            background-color: #28a745;
        }
        .status-indicator.red {
            background-color: #dc3545;
        }
        .error-section {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
            margin-top: 20px;
        }
        .refresh-note {
            text-align: right;
            color: #999;
            font-size: 0.9em;
            margin-top: 10px;
        }
    </style>
    <meta http-equiv="refresh" content="30">
</head>
<body>
    <div class="container">
        <h1>🔍 Iron Condor Scheduler Monitor</h1>
        
        <div class="status-grid">
            <div class="status-card {{ 'healthy' if is_healthy else 'unhealthy' }}">
                <div class="status-label">Overall Status</div>
                <div class="status-value">
                    <span class="status-indicator {{ 'green' if is_healthy else 'red' }}"></span>
                    {{ 'HEALTHY' if is_healthy else 'UNHEALTHY' }}
                </div>
            </div>
            
            <div class="status-card">
                <div class="status-label">Scheduler Process</div>
                <div class="status-value">
                    <span class="status-indicator {{ 'green' if status.is_alive else 'red' }}"></span>
                    {{ 'Running' if status.is_alive else 'Stopped' }}
                </div>
            </div>
            
            <div class="status-card">
                <div class="status-label">Total Executions</div>
                <div class="status-value">{{ status.total_executions }}</div>
            </div>
            
            <div class="status-card">
                <div class="status-label">Error Count</div>
                <div class="status-value" style="color: {{ '#dc3545' if status.error_count > 0 else '#28a745' }}">
                    {{ status.error_count }}
                </div>
            </div>
            
            <div class="status-card">
                <div class="status-label">Uptime</div>
                <div class="status-value">{{ '%.1f'|format(status.uptime_seconds / 3600) }}h</div>
            </div>
            
            <div class="status-card">
                <div class="status-label">Last Execution</div>
                <div class="status-value" style="font-size: 1em;">
                    {{ status.last_execution or 'Never' }}
                </div>
            </div>
        </div>
        
        {% if status.last_error %}
        <div class="error-section">
            <strong>⚠️ Last Error:</strong><br>
            <code>{{ status.last_error }}</code>
        </div>
        {% endif %}
        
        <div class="timestamp">
            Last updated: {{ now }}
        </div>
        <div class="refresh-note">
            Page auto-refreshes every 30 seconds
        </div>
    </div>
</body>
</html>
"""


@app.route('/')
def dashboard():
    """Render the main dashboard"""
    checker = ExternalHealthChecker()
    is_healthy, status = checker.check()
    
    return render_template_string(
        HTML_TEMPLATE,
        status=status,
        is_healthy=is_healthy,
        now=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    )


@app.route('/api/status')
def api_status():
    """JSON API endpoint for status"""
    checker = ExternalHealthChecker()
    is_healthy, status = checker.check()
    
    return jsonify({
        'is_healthy': is_healthy,
        'status': status.to_dict()
    })


@app.route('/api/health')
def health_check():
    """Simple health check endpoint for load balancers"""
    checker = ExternalHealthChecker()
    is_healthy, status = checker.check()
    
    if is_healthy:
        return jsonify({'status': 'ok'}), 200
    else:
        return jsonify({'status': 'error'}), 503


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Iron Condor Scheduler Dashboard')
    parser.add_argument('--port', type=int, default=5001,
                       help='Port to run on (default: 5001 to avoid conflicts with main API)')
    args = parser.parse_args()

    # Run on all interfaces so you can access from other machines
    print(f"Starting Iron Condor Scheduler Dashboard on port {args.port}...")
    print(f"Access at: http://localhost:{args.port}")
    print(f"API endpoints: http://localhost:{args.port}/api/status")
    app.run(host='0.0.0.0', port=args.port, debug=False)
