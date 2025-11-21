#!/usr/bin/env python3
"""
Iron Condor Scheduler Monitor
Provides health checks, logging, and alerting for the scheduler
"""
import json
import time
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any
import threading
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class HealthStatus:
    """Represents the health status of the scheduler"""
    timestamp: str
    is_alive: bool
    last_execution: Optional[str]
    error_count: int
    last_error: Optional[str]
    uptime_seconds: float
    active_jobs: int
    total_executions: int
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def is_healthy(self) -> bool:
        """Determine if the scheduler is in a healthy state"""
        if not self.is_alive:
            return False
        
        # Check if we've had recent activity (within last 5 minutes)
        if self.last_execution:
            last_exec_time = datetime.fromisoformat(self.last_execution)
            if datetime.now() - last_exec_time > timedelta(minutes=5):
                return False
        
        # Too many recent errors is unhealthy
        if self.error_count > 10:
            return False
        
        return True


class SchedulerMonitor:
    """Monitors the iron condor scheduler and provides health checks"""
    
    def __init__(self, state_file: str = "/tmp/scheduler_state.json"):
        self.state_file = Path(state_file)
        self.start_time = datetime.now()
        self.execution_count = 0
        self.error_count = 0
        self.last_error = None
        self.last_execution = None
        self.lock = threading.Lock()
        
        # Load existing state if available
        self._load_state()
        
    def _load_state(self):
        """Load state from disk if it exists"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                    self.execution_count = state.get('total_executions', 0)
                    self.error_count = state.get('error_count', 0)
                    self.last_error = state.get('last_error')
                    self.last_execution = state.get('last_execution')
                    logger.info(f"Loaded existing state: {state}")
            except Exception as e:
                logger.warning(f"Could not load state: {e}")
    
    def _save_state(self):
        """Persist current state to disk"""
        status = self.get_status()
        try:
            with open(self.state_file, 'w') as f:
                json.dump(status.to_dict(), f, indent=2)
        except Exception as e:
            logger.error(f"Could not save state: {e}")
    
    def heartbeat(self):
        """Record a heartbeat - call this on each successful execution"""
        with self.lock:
            self.last_execution = datetime.now().isoformat()
            self.execution_count += 1
            self._save_state()
            logger.debug(f"Heartbeat recorded: execution #{self.execution_count}")
    
    def record_error(self, error: str):
        """Record an error occurrence"""
        with self.lock:
            self.error_count += 1
            self.last_error = f"{datetime.now().isoformat()}: {error}"
            self._save_state()
            logger.error(f"Error recorded: {error}")
    
    def reset_errors(self):
        """Reset error counter (useful after recovering)"""
        with self.lock:
            self.error_count = 0
            self.last_error = None
            self._save_state()
            logger.info("Error counter reset")
    
    def get_status(self) -> HealthStatus:
        """Get current health status"""
        uptime = (datetime.now() - self.start_time).total_seconds()
        
        return HealthStatus(
            timestamp=datetime.now().isoformat(),
            is_alive=True,
            last_execution=self.last_execution,
            error_count=self.error_count,
            last_error=self.last_error,
            uptime_seconds=uptime,
            active_jobs=1,  # You can update this based on actual job count
            total_executions=self.execution_count
        )
    
    def check_health(self) -> tuple[bool, str]:
        """
        Check if the scheduler is healthy
        Returns: (is_healthy, message)
        """
        status = self.get_status()
        
        if not status.is_healthy():
            if not status.is_alive:
                return False, "Scheduler is not running"
            elif status.last_execution is None:
                return False, "No executions recorded yet"
            elif status.error_count > 10:
                return False, f"Too many errors: {status.error_count}"
            else:
                last_exec = datetime.fromisoformat(status.last_execution)
                minutes_ago = (datetime.now() - last_exec).total_seconds() / 60
                return False, f"No recent activity (last execution {minutes_ago:.1f} minutes ago)"
        
        return True, "All systems operational"


class ExternalHealthChecker:
    """Standalone health checker that can run independently"""
    
    def __init__(self, state_file: str = "/tmp/scheduler_state.json"):
        self.state_file = Path(state_file)
    
    def check(self) -> tuple[bool, HealthStatus]:
        """
        Check scheduler health from outside the process
        Returns: (is_healthy, status)
        """
        if not self.state_file.exists():
            status = HealthStatus(
                timestamp=datetime.now().isoformat(),
                is_alive=False,
                last_execution=None,
                error_count=0,
                last_error=None,
                uptime_seconds=0,
                active_jobs=0,
                total_executions=0
            )
            return False, status
        
        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
            
            status = HealthStatus(**data)
            
            # Check if state file is stale (no update in 2 minutes)
            state_time = datetime.fromisoformat(status.timestamp)
            if datetime.now() - state_time > timedelta(minutes=2):
                status.is_alive = False
                return False, status
            
            return status.is_healthy(), status
            
        except Exception as e:
            logger.error(f"Error checking health: {e}")
            status = HealthStatus(
                timestamp=datetime.now().isoformat(),
                is_alive=False,
                last_execution=None,
                error_count=0,
                last_error=str(e),
                uptime_seconds=0,
                active_jobs=0,
                total_executions=0
            )
            return False, status


def print_status(status: HealthStatus, is_healthy: bool):
    """Pretty print the status"""
    print("\n" + "="*60)
    print("IRON CONDOR SCHEDULER STATUS")
    print("="*60)
    print(f"Timestamp:        {status.timestamp}")
    print(f"Status:           {'🟢 HEALTHY' if is_healthy else '🔴 UNHEALTHY'}")
    print(f"Is Alive:         {'Yes' if status.is_alive else 'No'}")
    print(f"Last Execution:   {status.last_execution or 'Never'}")
    print(f"Total Executions: {status.total_executions}")
    print(f"Error Count:      {status.error_count}")
    print(f"Last Error:       {status.last_error or 'None'}")
    print(f"Uptime:           {status.uptime_seconds:.1f} seconds")
    print(f"Active Jobs:      {status.active_jobs}")
    print("="*60 + "\n")


if __name__ == "__main__":
    # This allows the monitor to be run standalone as a health check
    checker = ExternalHealthChecker()
    is_healthy, status = checker.check()
    
    print_status(status, is_healthy)
    
    # Exit with appropriate code for scripting
    sys.exit(0 if is_healthy else 1)
