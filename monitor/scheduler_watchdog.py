#!/usr/bin/env python3
"""
Scheduler Watchdog - Continuously monitors the scheduler and sends alerts
"""
import time
import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from pathlib import Path
from scheduler_monitor import ExternalHealthChecker, HealthStatus
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/watchdog.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class AlertManager:
    """Manages alerting when issues are detected"""
    
    def __init__(self, config: dict):
        self.config = config
        self.last_alert_time = None
        self.alert_cooldown = 300  # 5 minutes between alerts
        
    def should_send_alert(self) -> bool:
        """Check if enough time has passed to send another alert"""
        if self.last_alert_time is None:
            return True
        
        elapsed = (datetime.now() - self.last_alert_time).total_seconds()
        return elapsed >= self.alert_cooldown
    
    def send_email_alert(self, subject: str, body: str):
        """Send email alert via SMTP"""
        if not self.should_send_alert():
            logger.info("Suppressing alert due to cooldown")
            return
        
        try:
            # Get email configuration from environment or config
            smtp_host = os.getenv('SMTP_HOST', self.config.get('smtp_host', 'smtp.gmail.com'))
            smtp_port = int(os.getenv('SMTP_PORT', self.config.get('smtp_port', 587)))
            smtp_user = os.getenv('SMTP_USER', self.config.get('smtp_user'))
            smtp_pass = os.getenv('SMTP_PASS', self.config.get('smtp_pass'))
            alert_to = os.getenv('ALERT_EMAIL', self.config.get('alert_email'))
            
            if not all([smtp_user, smtp_pass, alert_to]):
                logger.warning("Email configuration incomplete, skipping email alert")
                return
            
            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = alert_to
            msg['Subject'] = f"[ALERT] {subject}"
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            
            self.last_alert_time = datetime.now()
            logger.info(f"Alert email sent: {subject}")
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
    
    def send_slack_alert(self, message: str):
        """Send Slack alert via webhook"""
        if not self.should_send_alert():
            logger.info("Suppressing alert due to cooldown")
            return
        
        try:
            import requests
            
            webhook_url = os.getenv('SLACK_WEBHOOK', self.config.get('slack_webhook'))
            
            if not webhook_url:
                logger.warning("Slack webhook not configured, skipping Slack alert")
                return
            
            payload = {
                'text': f"🚨 *Scheduler Alert*\n{message}",
                'username': 'Scheduler Watchdog'
            }
            
            response = requests.post(webhook_url, json=payload)
            response.raise_for_status()
            
            self.last_alert_time = datetime.now()
            logger.info("Alert sent to Slack")
            
        except ImportError:
            logger.warning("requests module not available for Slack alerts")
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
    
    def send_alert(self, subject: str, message: str):
        """Send alert through all configured channels"""
        logger.warning(f"ALERT: {subject} - {message}")
        
        # Log to console prominently
        print("\n" + "!"*60)
        print(f"ALERT: {subject}")
        print(f"Time: {datetime.now().isoformat()}")
        print(f"Message: {message}")
        print("!"*60 + "\n")
        
        # Send through configured channels
        self.send_email_alert(subject, message)
        self.send_slack_alert(message)


class SchedulerWatchdog:
    """Watches the scheduler and alerts on issues"""
    
    def __init__(self, check_interval: int = 60, config: dict = None):
        self.check_interval = check_interval  # seconds
        self.checker = ExternalHealthChecker()
        self.alert_manager = AlertManager(config or {})
        self.consecutive_failures = 0
        self.max_consecutive_failures = 3
        self.running = False
        
    def run(self):
        """Run the watchdog loop"""
        self.running = True
        logger.info(f"Starting watchdog with {self.check_interval}s check interval")
        
        try:
            while self.running:
                self._check_scheduler()
                time.sleep(self.check_interval)
        except KeyboardInterrupt:
            logger.info("Watchdog stopped by user")
        except Exception as e:
            logger.error(f"Watchdog crashed: {e}")
            raise
    
    def _check_scheduler(self):
        """Perform a single health check"""
        try:
            is_healthy, status = self.checker.check()
            
            if is_healthy:
                # Reset failure counter on success
                if self.consecutive_failures > 0:
                    logger.info("Scheduler recovered!")
                    self.alert_manager.send_alert(
                        "Scheduler Recovery",
                        f"Scheduler is now healthy after {self.consecutive_failures} failed checks"
                    )
                self.consecutive_failures = 0
                logger.debug(f"Health check passed: {status.total_executions} total executions")
            else:
                self.consecutive_failures += 1
                logger.warning(f"Health check failed (attempt {self.consecutive_failures})")
                
                # Only alert after consecutive failures
                if self.consecutive_failures >= self.max_consecutive_failures:
                    message = self._build_alert_message(status)
                    self.alert_manager.send_alert(
                        "Scheduler Health Check Failed",
                        message
                    )
                    
        except Exception as e:
            logger.error(f"Error during health check: {e}")
            self.consecutive_failures += 1
    
    def _build_alert_message(self, status: HealthStatus) -> str:
        """Build detailed alert message"""
        lines = [
            "Scheduler health check has failed!",
            "",
            f"Status: {'ALIVE' if status.is_alive else 'DEAD'}",
            f"Last Execution: {status.last_execution or 'Never'}",
            f"Total Executions: {status.total_executions}",
            f"Error Count: {status.error_count}",
            f"Last Error: {status.last_error or 'None'}",
            f"Consecutive Failures: {self.consecutive_failures}",
            "",
            f"Check time: {datetime.now().isoformat()}"
        ]
        return "\n".join(lines)
    
    def stop(self):
        """Stop the watchdog"""
        self.running = False


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Scheduler Watchdog')
    parser.add_argument('--interval', type=int, default=60,
                       help='Check interval in seconds (default: 60)')
    parser.add_argument('--config', type=str,
                       help='Path to configuration file')
    
    args = parser.parse_args()
    
    config = {}
    if args.config and Path(args.config).exists():
        import json
        with open(args.config) as f:
            config = json.load(f)
    
    watchdog = SchedulerWatchdog(
        check_interval=args.interval,
        config=config
    )
    
    try:
        watchdog.run()
    except KeyboardInterrupt:
        print("\nShutting down watchdog...")
        watchdog.stop()


if __name__ == "__main__":
    main()
