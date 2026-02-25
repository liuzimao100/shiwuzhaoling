from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from find.views import upload_photo, compare_photo, user_register, user_login, get_items, get_my_items

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/upload/', upload_photo, name='upload_photo'),
    path('api/compare/', compare_photo, name='compare_photo'),
    path('api/register/', user_register, name='user_register'),
    path('api/login/', user_login, name='user_login'),
    path('api/items/', get_items, name='get_items'),
    path('api/my-items/', get_my_items, name='get_my_items'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
