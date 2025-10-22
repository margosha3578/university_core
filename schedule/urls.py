from django.urls import path
from . import views

app_name = 'schedule'

urlpatterns = [
    # Event CRUD operations
    path('events/', views.api_events_list, name='events_list'),
    path('events/<int:event_id>/', views.api_event_detail, name='event_detail'),
    path('events/create/', views.api_create_event, name='create_event'),
    path('events/<int:event_id>/update/', views.api_update_event, name='update_event'),
    path('events/<int:event_id>/delete/', views.api_delete_event, name='delete_event'),
    
    # Events by date
    path('events/date/<int:year>/<int:month>/<int:day>/', views.api_events_by_date, name='events_by_date'),
]

