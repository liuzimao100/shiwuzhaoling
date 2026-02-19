from django.contrib import admin
from django.urls import path
from find.views import upload_photo, compare_photo, user_register, user_login

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/upload/', upload_photo, name='upload_photo'),
    path('api/compare/', compare_photo, name='compare_photo'),
    path('api/register/', user_register, name='user_register'),
    path('api/login/', user_login, name='user_login'),
]
