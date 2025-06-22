from datetime import datetime, timezone, timedelta

# IST timezone (GMT+05:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    """Get current datetime in IST timezone"""
    return datetime.now(IST)

def convert_to_ist(dt):
    """Convert a datetime to IST timezone"""
    if dt is None:
        return None
    
    # If datetime is naive (no timezone), assume it's UTC and convert to IST
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    return dt.astimezone(IST)

def get_ist_datetime_for_db():
    """Get current IST datetime without timezone info for database storage"""
    return get_ist_now().replace(tzinfo=None)

def format_ist_datetime(dt):
    """Format datetime in IST for API responses"""
    if dt is None:
        return None
    
    # If stored datetime is naive, assume it's already in IST (not UTC)
    # This is the key fix - times are stored as IST but without timezone info
    if dt.tzinfo is None:
        # Add IST timezone info to the naive datetime that's already in IST
        dt = dt.replace(tzinfo=IST)
    else:
        dt = convert_to_ist(dt)
    
    return dt.isoformat()

def convert_ist_stored_to_comparison_format(stored_dt):
    """Convert IST datetime stored as naive to format suitable for comparison"""
    if stored_dt is None:
        return None
    
    # The stored datetime is already in IST, just stored as naive
    # For comparison with current IST time (also naive), use as-is
    return stored_dt

def convert_utc_to_ist_naive(utc_dt):
    """Convert UTC datetime to IST and return as naive datetime for database comparison"""
    if utc_dt is None:
        return None
    
    # If it's naive, assume it's UTC
    if utc_dt.tzinfo is None:
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    
    # Convert to IST and make naive
    ist_dt = utc_dt.astimezone(IST)
    return ist_dt.replace(tzinfo=None)

def get_current_ist_naive():
    """Get current time in IST as naive datetime for database operations"""
    return datetime.now(IST).replace(tzinfo=None)

def debug_timezone_info():
    """Get detailed timezone debugging information"""
    utc_now = datetime.now(timezone.utc)
    ist_now = get_ist_now()
    ist_naive = get_ist_datetime_for_db()
    
    return {
        'utc_now': utc_now.isoformat(),
        'ist_now_with_tz': ist_now.isoformat(),
        'ist_now_naive': ist_naive.isoformat(),
        'timezone_offset_hours': 5.5,
        'current_timezone': 'IST (GMT+05:30)'
    }

def compare_times_debug(time1, time2, label1="Time 1", label2="Time 2"):
    """Debug helper to compare two times with detailed info"""
    return {
        f'{label1}_raw': time1.isoformat() if time1 else None,
        f'{label2}_raw': time2.isoformat() if time2 else None,
        f'{label1}_formatted': format_ist_datetime(time1) if time1 else None,
        f'{label2}_formatted': format_ist_datetime(time2) if time2 else None,
        'comparison': {
            'time1_before_time2': time1 < time2 if (time1 and time2) else None,
            'time1_after_time2': time1 > time2 if (time1 and time2) else None,
            'times_equal': time1 == time2 if (time1 and time2) else None
        }
    }
