#!/usr/bin/env python3
"""
Demo script showing the monitoring system in action
Run this to see how it works before integrating into your scheduler
"""
import time
import random
from scheduler_monitor import SchedulerMonitor
from datetime import datetime

def demo_monitoring():
    """Demonstrate the monitoring system"""
    print("\n" + "="*60)
    print("SCHEDULER MONITORING DEMO")
    print("="*60 + "\n")
    
    # Create monitor
    monitor = SchedulerMonitor()
    
    print("1. Starting fresh monitor...")
    status = monitor.get_status()
    print(f"   Initial executions: {status.total_executions}")
    print(f"   Initial errors: {status.error_count}\n")
    
    # Simulate some successful executions
    print("2. Simulating 5 successful job executions...")
    for i in range(5):
        print(f"   Execution {i+1}...")
        monitor.heartbeat()
        time.sleep(0.5)
    
    status = monitor.get_status()
    print(f"   Total executions: {status.total_executions}")
    print(f"   Last execution: {status.last_execution}\n")
    
    # Simulate some errors
    print("3. Simulating 3 errors...")
    errors = [
        "Connection timeout to Alpaca API",
        "Invalid options contract: SPY241120C450",
        "Insufficient buying power for trade"
    ]
    
    for error in errors:
        print(f"   Error: {error}")
        monitor.record_error(error)
        time.sleep(0.3)
    
    status = monitor.get_status()
    print(f"   Total errors: {status.error_count}")
    print(f"   Last error: {status.last_error}\n")
    
    # Check health
    print("4. Checking health status...")
    is_healthy, message = monitor.check_health()
    print(f"   Healthy: {is_healthy}")
    print(f"   Message: {message}\n")
    
    # Show full status
    print("5. Full status dump:")
    print(f"   Timestamp: {status.timestamp}")
    print(f"   Is Alive: {status.is_alive}")
    print(f"   Last Execution: {status.last_execution}")
    print(f"   Error Count: {status.error_count}")
    print(f"   Last Error: {status.last_error}")
    print(f"   Uptime: {status.uptime_seconds:.1f} seconds")
    print(f"   Total Executions: {status.total_executions}")
    print()
    
    # Demonstrate recovery
    print("6. Simulating error recovery (resetting errors)...")
    monitor.reset_errors()
    status = monitor.get_status()
    print(f"   Error count after reset: {status.error_count}\n")
    
    # Simulate external health check
    print("7. Demonstrating external health check...")
    print("   (This is what the watchdog uses)\n")
    
    from scheduler_monitor import ExternalHealthChecker
    checker = ExternalHealthChecker()
    is_healthy, status = checker.check()
    
    print(f"   External check result: {'HEALTHY' if is_healthy else 'UNHEALTHY'}")
    print(f"   Process alive: {status.is_alive}")
    print(f"   Total executions: {status.total_executions}\n")
    
    print("="*60)
    print("DEMO COMPLETE")
    print("="*60)
    print("\nState file location: /tmp/scheduler_state.json")
    print("You can check it with: cat /tmp/scheduler_state.json")
    print("\nNext steps:")
    print("  1. Run: python scheduler_monitor.py")
    print("  2. Integrate into your scheduler")
    print("  3. Start the watchdog: python scheduler_watchdog.py")
    print()


def demo_realistic_scheduler():
    """Simulate a more realistic scheduler with random behavior"""
    print("\n" + "="*60)
    print("REALISTIC SCHEDULER SIMULATION (30 seconds)")
    print("="*60 + "\n")
    print("Simulating a scheduler checking iron condors every 5 seconds")
    print("Press Ctrl+C to stop early\n")
    
    monitor = SchedulerMonitor()
    
    try:
        for i in range(6):  # 30 seconds total
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Checking iron condors...")
            
            # Simulate work
            time.sleep(random.uniform(0.5, 2.0))
            
            # 80% success rate
            if random.random() < 0.8:
                monitor.heartbeat()
                print("  ✓ Check completed successfully")
            else:
                error = random.choice([
                    "API rate limit exceeded",
                    "Position data unavailable",
                    "Network timeout",
                ])
                monitor.record_error(error)
                print(f"  ✗ Error: {error}")
            
            status = monitor.get_status()
            print(f"  Stats: {status.total_executions} executions, {status.error_count} errors\n")
            
            if i < 5:  # Don't sleep after last iteration
                time.sleep(3)
        
        print("\nSimulation complete!")
        print("Run 'python scheduler_monitor.py' to see final status")
        
    except KeyboardInterrupt:
        print("\n\nSimulation stopped by user")
        print("Run 'python scheduler_monitor.py' to see current status")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--realistic":
        demo_realistic_scheduler()
    else:
        demo_monitoring()
