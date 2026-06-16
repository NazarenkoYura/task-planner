from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название проекта")
    description = models.TextField(blank=True, null=True, verbose_name="Описание проекта")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects', verbose_name="Владелец")
    is_deleted = models.BooleanField(default=False, verbose_name="Удален")

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.save()
        # Каскадное мягкое удаление задач проекта
        self.tasks.all().update(is_deleted=True)


class Tag(models.Model):
    name = models.CharField(max_length=50, verbose_name="Название тега")
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='tags', 
        verbose_name="Владелец", 
        null=True, 
        blank=True
    )
    # Флаг мягкого удаления тега
    is_deleted = models.BooleanField(default=False, verbose_name="Удален")

    class Meta:
        # Уникальный индекс удален для поддержки мягкого удаления и реанимации тегов
        verbose_name = "Тег"
        verbose_name_plural = "Теги"

    def __str__(self):
        return self.name

    # Переопределяем метод удаления для тега
    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.save()


class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'К выполнению'),
        ('in_progress', 'В процессе'),
        ('done', 'Готово'),
    ]

    title = models.CharField(max_length=200, verbose_name="Заголовок")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo', verbose_name="Статус")
    due_date = models.DateField(blank=True, null=True, verbose_name="Срок выполнения")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', blank=True, null=True, verbose_name="Проект")
    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks', verbose_name="Исполнитель")
    tags = models.ManyToManyField(Tag, related_name='tasks', blank=True, verbose_name="Теги")
    is_deleted = models.BooleanField(default=False, verbose_name="Удалена")

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.save()