import json
import logging
from datetime import datetime, date
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q
from users.jwt_utils import jwt_required
from .models import Event

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["GET"])
@jwt_required
def api_events_list(request):
    """Get list of events with optional filtering"""
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        year = request.GET.get('year')
        month = request.GET.get('month')
        event_type = request.GET.get('event_type')
        priority = request.GET.get('priority')
        search = request.GET.get('search')
        
        # Start with all events
        events = Event.objects.all()
        
        # Apply filters
        if year:
            events = events.filter(assigned_date__year=year)
        if month:
            events = events.filter(assigned_date__month=month)
        if event_type:
            events = events.filter(event_type=event_type)
        if priority:
            events = events.filter(priority=priority)
        if search:
            events = events.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
        
        # Order by date and time
        events = events.order_by('assigned_date', 'start_time')
        
        # Pagination
        paginator = Paginator(events, per_page)
        page_obj = paginator.get_page(page)
        
        # Prepare response data
        events_data = []
        for event in page_obj:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'creator': {
                    'id': event.creator.id,
                    'email': event.creator.email,
                    'full_name': event.creator.full_name,
                },
                'assigned_date': event.assigned_date.isoformat(),
                'start_time': event.start_time.isoformat() if event.start_time else None,
                'end_time': event.end_time.isoformat() if event.end_time else None,
                'event_type': event.event_type,
                'priority': event.priority,
                'location': event.location,
                'is_all_day': event.is_all_day,
                'is_recurring': event.is_recurring,
                'created_at': event.created_at.isoformat(),
                'updated_at': event.updated_at.isoformat(),
                'is_past': event.is_past,
                'is_today': event.is_today,
                'is_upcoming': event.is_upcoming,
            })
        
        return JsonResponse({
            'success': True,
            'events': events_data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_events': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching events list: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch events'}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
@jwt_required
def api_events_by_date(request, year, month, day):
    """Get events for a specific date"""
    try:
        target_date = date(int(year), int(month), int(day))
        events = Event.objects.filter(assigned_date=target_date).order_by('start_time')
        
        events_data = []
        for event in events:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'creator': {
                    'id': event.creator.id,
                    'email': event.creator.email,
                    'full_name': event.creator.full_name,
                },
                'assigned_date': event.assigned_date.isoformat(),
                'start_time': event.start_time.isoformat() if event.start_time else None,
                'end_time': event.end_time.isoformat() if event.end_time else None,
                'event_type': event.event_type,
                'priority': event.priority,
                'location': event.location,
                'is_all_day': event.is_all_day,
                'is_recurring': event.is_recurring,
                'created_at': event.created_at.isoformat(),
                'updated_at': event.updated_at.isoformat(),
            })
        
        return JsonResponse({
            'success': True,
            'events': events_data,
            'date': target_date.isoformat(),
        })
        
    except ValueError as e:
        logger.warning(f"Invalid date format: {str(e)}")
        return JsonResponse({'error': 'Invalid date format'}, status=400)
    except Exception as e:
        logger.error(f"Error fetching events for date {year}-{month}-{day}: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch events for date'}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
@jwt_required
def api_event_detail(request, event_id):
    """Get a specific event by ID"""
    try:
        event = Event.objects.get(id=event_id)
        
        event_data = {
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'creator': {
                'id': event.creator.id,
                'email': event.creator.email,
                'full_name': event.creator.full_name,
            },
            'assigned_date': event.assigned_date.isoformat(),
            'start_time': event.start_time.isoformat() if event.start_time else None,
            'end_time': event.end_time.isoformat() if event.end_time else None,
            'event_type': event.event_type,
            'priority': event.priority,
            'location': event.location,
            'is_all_day': event.is_all_day,
            'is_recurring': event.is_recurring,
            'created_at': event.created_at.isoformat(),
            'updated_at': event.updated_at.isoformat(),
        }
        
        return JsonResponse({
            'success': True,
            'event': event_data,
        })
        
    except Event.DoesNotExist:
        logger.warning(f"Event with ID {event_id} not found")
        return JsonResponse({'error': 'Event not found'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching event {event_id}: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch event'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@jwt_required
def api_create_event(request):
    """Create a new event"""
    logger.info(f"Event creation attempt by: {request.user.email} (Role: {request.user.user_role})")
    # Only admin and professor can create events
    if request.user.user_role not in ['admin', 'professor']:
        logger.warning(f"Unauthorized event creation attempt by: {request.user.email}")
        return JsonResponse({
            'error': 'Only admin and professor users can create events'
        }, status=403)
    
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['title', 'assigned_date']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({'error': f'{field} is required'}, status=400)
        
        # Parse assigned_date
        try:
            assigned_date = datetime.strptime(data['assigned_date'], '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        
        # Parse times if provided
        start_time = None
        end_time = None
        if data.get('start_time'):
            try:
                start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            except ValueError:
                return JsonResponse({'error': 'Invalid start_time format. Use HH:MM'}, status=400)
        
        if data.get('end_time'):
            try:
                end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            except ValueError:
                return JsonResponse({'error': 'Invalid end_time format. Use HH:MM'}, status=400)
        
        # Validate time logic
        if start_time and end_time and end_time <= start_time:
            return JsonResponse({'error': 'End time must be after start time'}, status=400)
        
        # Create event
        event = Event.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            creator=request.user,
            assigned_date=assigned_date,
            start_time=start_time,
            end_time=end_time,
            event_type=data.get('event_type', 'other'),
            priority=data.get('priority', 'medium'),
            location=data.get('location', ''),
            is_all_day=data.get('is_all_day', False),
            is_recurring=data.get('is_recurring', False),
        )
        
        logger.warning(f"Event created: {event.title} by {request.user.email}")
        
        return JsonResponse({
            'success': True,
            'message': 'Event created successfully',
            'event': {
                'id': event.id,
                'title': event.title,
                'assigned_date': event.assigned_date.isoformat(),
            }
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        logger.error(f"Error creating event: {str(e)}")
        return JsonResponse({'error': 'Failed to create event'}, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
@jwt_required
def api_update_event(request, event_id):
    """Update an existing event"""
    logger.info(f"Event update attempt: Event ID {event_id} by {request.user.email} (Role: {request.user.user_role})")
    # Only admin and professor can update events
    if request.user.user_role not in ['admin', 'professor']:
        logger.warning(f"Unauthorized event update attempt: Event ID {event_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Only admin and professor users can update events'
        }, status=403)
    
    try:
        event = Event.objects.get(id=event_id)
        data = json.loads(request.body)
        
        # Update fields
        if 'title' in data:
            event.title = data['title']
        if 'description' in data:
            event.description = data['description']
        if 'assigned_date' in data:
            try:
                event.assigned_date = datetime.strptime(data['assigned_date'], '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        
        if 'start_time' in data:
            if data['start_time']:
                try:
                    event.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
                except ValueError:
                    return JsonResponse({'error': 'Invalid start_time format. Use HH:MM'}, status=400)
            else:
                event.start_time = None
        
        if 'end_time' in data:
            if data['end_time']:
                try:
                    event.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
                except ValueError:
                    return JsonResponse({'error': 'Invalid end_time format. Use HH:MM'}, status=400)
            else:
                event.end_time = None
        
        # Validate time logic
        if event.start_time and event.end_time and event.end_time <= event.start_time:
            return JsonResponse({'error': 'End time must be after start time'}, status=400)
        
        if 'event_type' in data:
            event.event_type = data['event_type']
        if 'priority' in data:
            event.priority = data['priority']
        if 'location' in data:
            event.location = data['location']
        if 'is_all_day' in data:
            event.is_all_day = data['is_all_day']
        if 'is_recurring' in data:
            event.is_recurring = data['is_recurring']
        
        event.save()
        
        logger.warning(f"Event updated: {event.title} by {request.user.email}")
        
        return JsonResponse({
            'success': True,
            'message': 'Event updated successfully',
            'event': {
                'id': event.id,
                'title': event.title,
                'assigned_date': event.assigned_date.isoformat(),
            }
        })
        
    except Event.DoesNotExist:
        logger.warning(f"Event with ID {event_id} not found for update")
        return JsonResponse({'error': 'Event not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        logger.error(f"Error updating event {event_id}: {str(e)}")
        return JsonResponse({'error': 'Failed to update event'}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
@jwt_required
def api_delete_event(request, event_id):
    """Delete an event"""
    logger.info(f"Event deletion attempt: Event ID {event_id} by {request.user.email} (Role: {request.user.user_role})")
    # Only admin and professor can delete events
    if request.user.user_role not in ['admin', 'professor']:
        logger.warning(f"Unauthorized event deletion attempt: Event ID {event_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Only admin and professor users can delete events'
        }, status=403)
    
    try:
        event = Event.objects.get(id=event_id)
        event_title = event.title
        event.delete()
        
        logger.warning(f"Event deleted: {event_title} by {request.user.email}")
        
        return JsonResponse({
            'success': True,
            'message': 'Event deleted successfully',
        })
        
    except Event.DoesNotExist:
        logger.warning(f"Event with ID {event_id} not found for deletion")
        return JsonResponse({'error': 'Event not found'}, status=404)
    except Exception as e:
        logger.error(f"Error deleting event {event_id}: {str(e)}")
        return JsonResponse({'error': 'Failed to delete event'}, status=500)