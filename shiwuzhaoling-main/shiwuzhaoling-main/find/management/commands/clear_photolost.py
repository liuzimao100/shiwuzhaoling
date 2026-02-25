from django.core.management.base import BaseCommand
from find.models import PhotoLost


class Command(BaseCommand):
    help = 'Clear all PhotoLost records and delete related image files'

    def handle(self, *args, **options):
        count = PhotoLost.objects.count()
        for obj in PhotoLost.objects.all():
            if obj.image:
                obj.image.delete(save=False)
            obj.delete()
        self.stdout.write(self.style.SUCCESS(f'Cleared {count} PhotoLost records'))
