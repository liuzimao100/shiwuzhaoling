from django.contrib import admin
from django.urls import path
from find.views import upload_photo, compare_photo

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/upload/', upload_photo, name='upload_photo'),
    path('api/compare/', compare_photo, name='compare_photo'),
]
