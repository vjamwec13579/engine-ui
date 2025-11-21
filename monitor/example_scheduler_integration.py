#!/usr/bin/env python3
"""
Example integration of SchedulerMonitor with your iron condor scheduler

This shows how to integrate the monitoring into your existing scheduler code.
"""
from apscheduler.schedulers.blocking import BlockingScheduler
from scheduler_monitor import SchedulerMonitor
import logging

logger = logging.getLogger(__name__)


class MonitoredIronCondorScheduler:
    """Example of your scheduler with monitoring integrated"""
    
    def __init__(self):
        self.scheduler = BlockingScheduler()
        self.monitor = SchedulerMonitor(state_file="/tmp/scheduler_state.json")
        
        # Set up your existing jobs
        self._setup_jobs()
    
    def _setup_jobs(self):
        """Set up your scheduled jobs"""
        # Example: Check iron condors every 5 minutes during market hours
        self.scheduler.add_job(
            func=self.check_iron_condors,
            trigger='cron',
            minute='*/5',
            hour='9-16',  # Market hours
            day_of_week='mon-fri',
            id='iron_condor_check'
        )
        
        # Heartbeat job - updates status every 30 seconds
        self.scheduler.add_job(
            func=self.monitor.heartbeat,
            trigger='interval',
            seconds=30,
            id='heartbeat'
        )
    
    def check_iron_condors(self):
        """Your actual iron condor checking logic"""
        try:
            logger.info("Checking iron condors...")
            
            # YOUR EXISTING LOGIC HERE
            # Example:
            # - Check positions
            # - Calculate Greeks
            # - Determine if adjustment needed
            # - Execute trades if necessary
            
            # Simulate work
            self._do_iron_condor_checks()
            
            # Record successful execution
            self.monitor.heartbeat()
            
            logger.info("Iron condor check completed successfully")
            
        except Exception as e:
            logger.error(f"Error in iron condor check: {e}")
            self.monitor.record_error(str(e))
            raise
    
    def _do_iron_condor_checks(self):
        """
        Replace this with your actual iron condor logic
        This is where you'd:
        - Fetch positions from Alpaca
        - Calculate current Greeks
        - Check against your thresholds
        - Execute adjustments if needed
        """
        # Placeholder for your logic
        pass
    
    def run(self):
        """Start the scheduler"""
        logger.info("Starting monitored iron condor scheduler")
        try:
            self.scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            logger.info("Scheduler stopped")
    
    def status(self):
        """Get current status (for --status command)"""
        status = self.monitor.get_status()
        is_healthy, message = self.monitor.check_health()
        
        print(f"\nScheduler Status: {message}")
        print(f"Total Executions: {status.total_executions}")
        print(f"Last Execution: {status.last_execution}")
        print(f"Error Count: {status.error_count}")
        if status.last_error:
            print(f"Last Error: {status.last_error}")
        print()


def main():
    """Main entry point with command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Iron Condor Scheduler')
    parser.add_argument('--status', action='store_true',
                       help='Show scheduler status and exit')
    
    args = parser.parse_args()
    
    scheduler = MonitoredIronCondorScheduler()
    
    if args.status:
        scheduler.status()
    else:
        scheduler.run()


if __name__ == "__main__":
    main()
