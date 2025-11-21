# Iron Condor Scheduler Monitoring System

Complete monitoring solution for your APScheduler-based iron condor trading system.

## Components

1. **SchedulerMonitor** - Core monitoring library integrated into your scheduler
2. **ExternalHealthChecker** - Standalone health checker for external monitoring
3. **SchedulerWatchdog** - Continuous monitoring daemon with alerting
4. **Web Dashboard** - Simple web interface to view status

## Quick Start

### 1. Integrate Monitoring into Your Scheduler

Add this to your existing scheduler code:

```python
from scheduler_monitor import SchedulerMonitor

class YourScheduler:
    def __init__(self):
        self.monitor = SchedulerMonitor()
        # ... your existing setup
        
    def your_job_function(self):
        try:
            # Your existing logic
            do_iron_condor_checks()
            
            # Record successful execution
            self.monitor.heartbeat()
            
        except Exception as e:
            # Record errors
            self.monitor.record_error(str(e))
            raise
```

### 2. Check Status Manually

```bash
# Quick health check
python scheduler_monitor.py

# Will show status and exit with code 0 (healthy) or 1 (unhealthy)
```

### 3. Run the Watchdog (Recommended)

The watchdog monitors your scheduler and sends alerts when issues occur:

```bash
# Basic usage - checks every 60 seconds
python scheduler_watchdog.py

# Custom interval
python scheduler_watchdog.py --interval 30

# With configuration file
python scheduler_watchdog.py --config watchdog_config.json
```

### 4. View Web Dashboard

```bash
# Install Flask if needed
pip install flask

# Start dashboard
python scheduler_dashboard.py

# Visit http://localhost:5000
```

## Configuration

### Email Alerts

Set environment variables or create `watchdog_config.json`:

```bash
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"
export ALERT_EMAIL="james@yourcompany.com"
```

Or in `watchdog_config.json`:

```json
{
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "your-email@gmail.com",
    "smtp_pass": "your-app-password",
    "alert_email": "james@yourcompany.com"
}
```

### Slack Alerts

```bash
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

Or add to `watchdog_config.json`:

```json
{
    "slack_webhook": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
}
```

## Running as System Services

### Install Services

1. Edit the service files to update paths:
   ```bash
   sudo nano iron-condor-scheduler.service
   sudo nano scheduler-watchdog.service
   ```

2. Copy to systemd:
   ```bash
   sudo cp iron-condor-scheduler.service /etc/systemd/system/
   sudo cp scheduler-watchdog.service /etc/systemd/system/
   ```

3. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable iron-condor-scheduler
   sudo systemctl enable scheduler-watchdog
   sudo systemctl start iron-condor-scheduler
   sudo systemctl start scheduler-watchdog
   ```

### Manage Services

```bash
# Check status
sudo systemctl status iron-condor-scheduler
sudo systemctl status scheduler-watchdog

# View logs
sudo journalctl -u iron-condor-scheduler -f
sudo journalctl -u scheduler-watchdog -f

# Restart
sudo systemctl restart iron-condor-scheduler

# Stop
sudo systemctl stop iron-condor-scheduler
```

## API Endpoints

The web dashboard provides JSON APIs:

### GET /api/status
Full status information:
```bash
curl http://localhost:5000/api/status | jq
```

### GET /api/health
Simple health check (returns 200 if healthy, 503 if not):
```bash
curl http://localhost:5000/api/health
```

## Monitoring Strategy

### Recommended Setup

1. **Scheduler Process**: Run your scheduler with integrated `SchedulerMonitor`
2. **Watchdog Process**: Run `scheduler_watchdog.py` as a separate process/service
3. **Dashboard**: Optional, run `scheduler_dashboard.py` for visual monitoring
4. **External Checks**: Use cron or external monitoring to check the watchdog itself

### Example Cron Jobs

Add to your crontab (`crontab -e`):

```bash
# Check scheduler health every 5 minutes
*/5 * * * * /usr/bin/python3 /path/to/scheduler_monitor.py || echo "Scheduler unhealthy!" | mail -s "Scheduler Alert" james@yourcompany.com

# Ensure watchdog is running
*/10 * * * * pgrep -f scheduler_watchdog.py || /usr/bin/python3 /path/to/scheduler_watchdog.py &
```

## Health Check Logic

The system considers the scheduler **unhealthy** if:

1. Process is not running (no state file updates)
2. No execution recorded in last 5 minutes
3. More than 10 errors recorded
4. State file is stale (>2 minutes old)

## Alerting Behavior

- **Cooldown**: 5 minutes between alerts (prevents spam)
- **Consecutive Failures**: Requires 3 consecutive failed checks before alerting
- **Recovery Notification**: Sends alert when scheduler recovers

## Troubleshooting

### Scheduler shows as "dead" but it's running

Check if the state file exists and is being updated:
```bash
ls -lh /tmp/scheduler_state.json
cat /tmp/scheduler_state.json
```

### Not receiving email alerts

1. Check SMTP credentials:
   ```bash
   echo $SMTP_USER
   echo $ALERT_EMAIL
   ```

2. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)

3. Check watchdog logs:
   ```bash
   tail -f /tmp/watchdog.log
   ```

### Watchdog keeps alerting

- Check your scheduler's execution frequency
- Verify jobs are actually running
- Look at scheduler logs for errors

## File Locations

- **State File**: `/tmp/scheduler_state.json` - Contains current status
- **Watchdog Log**: `/tmp/watchdog.log` - Watchdog activity log
- **Systemd Logs**: `journalctl -u iron-condor-scheduler`

## Testing

### Test the Monitor Integration

```python
from scheduler_monitor import SchedulerMonitor

monitor = SchedulerMonitor()

# Simulate successful execution
monitor.heartbeat()

# Simulate error
monitor.record_error("Test error")

# Check status
status = monitor.get_status()
print(status.to_dict())
```

### Test the Watchdog

```bash
# Run watchdog with debug logging
python scheduler_watchdog.py --interval 10

# In another terminal, stop your scheduler
# Watchdog should detect and alert within ~30 seconds
```

### Test Alerts

```bash
# Temporarily configure alerts
export ALERT_EMAIL="your-test-email@gmail.com"

# Run watchdog
python scheduler_watchdog.py --interval 10

# Stop your scheduler to trigger alert
```

## Advanced Usage

### Custom State File Location

```python
monitor = SchedulerMonitor(state_file="/var/run/my-scheduler/state.json")
```

### Integrate with Other Monitoring Systems

The JSON API can be integrated with:
- Prometheus (scrape `/api/status`)
- Datadog (custom check using the health endpoint)
- Nagios/Icinga (use `scheduler_monitor.py` exit code)

### Multiple Schedulers

Run separate monitors for each:

```python
condor_monitor = SchedulerMonitor(state_file="/tmp/condor_state.json")
calendar_monitor = SchedulerMonitor(state_file="/tmp/calendar_state.json")
```

## Next Steps

1. **Integrate** `SchedulerMonitor` into your existing scheduler
2. **Test** manually with `python scheduler_monitor.py`
3. **Configure** alerts (email/Slack)
4. **Deploy** watchdog as a service
5. **Access** dashboard at http://localhost:5000
6. **Monitor** logs to ensure everything is working

## Support

Files included:
- `scheduler_monitor.py` - Core monitoring library
- `scheduler_watchdog.py` - Alert daemon
- `scheduler_dashboard.py` - Web dashboard
- `example_scheduler_integration.py` - Integration example
- `iron-condor-scheduler.service` - Systemd service for scheduler
- `scheduler-watchdog.service` - Systemd service for watchdog

For questions or issues, check the logs first:
```bash
# Scheduler logs
sudo journalctl -u iron-condor-scheduler -n 100

# Watchdog logs
cat /tmp/watchdog.log
```
