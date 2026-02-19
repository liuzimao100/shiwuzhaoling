from django.db import models


class PhotoLost(models.Model):
    image = models.ImageField(upload_to='photo_lost/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'photo_lost'
