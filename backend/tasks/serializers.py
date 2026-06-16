from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Tag, Task
import datetime

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class TaskSerializer(serializers.ModelSerializer):
    assignee = serializers.ReadOnlyField(source='assignee.username')
    project_name = serializers.ReadOnlyField(source='project.name')
    
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Tag.objects.all(), 
        source='tags', 
        write_only=True, 
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'due_date', 
            'project', 'project_name', 'assignee', 'tags', 'tag_ids'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user and not request.user.is_anonymous:
            self.fields['tag_ids'].queryset = Tag.objects.filter(owner=request.user, is_deleted=False)

    def validate_due_date(self, value):
        today = datetime.date.today()
        if value:
            if value < today:
                raise serializers.ValidationError("Срок выполнения не может быть меньше сегодняшней даты.")
            try:
                max_date = today.replace(year=today.year + 10)
            except ValueError:
                max_date = today + datetime.timedelta(days=3652)
            if value > max_date:
                raise serializers.ValidationError(
                    f"Срок выполнения не может превышать 10 лет вперед (максимум до {max_date.strftime('%d.%m.%Y')})."
                )
        return value

    # ПЕРЕКРЕСТНАЯ КЛАССОВАЯ ВАЛИДАЦИЯ УНИКАЛЬНОСТИ НАЗВАНИЙ ЗАДАЧ ВНУТРИ ПРОЕКТА
    def validate(self, attrs):
        title = attrs.get('title')
        project = attrs.get('project')
        
        # Для поддержки частичного обновления (PATCH) извлекаем текущие значения из БД, 
        # если они не были переданы в теле запроса
        if self.instance:
            if 'title' not in attrs:
                title = self.instance.title
            if 'project' not in attrs:
                project = self.instance.project

        # Проверка уникальности выполняется только если задача привязана к проекту
        if project and title:
            # Ищем активные (неудаленные) задачи в этом же проекте с совпадающим именем (без учета регистра)
            duplicate_tasks = Task.objects.filter(
                project=project,
                title__iexact=title,
                is_deleted=False
            )
            
            # При редактировании исключаем саму эту задачу из проверки на дубликаты
            if self.instance:
                duplicate_tasks = duplicate_tasks.exclude(id=self.instance.id)
                
            if duplicate_tasks.exists():
                raise serializers.ValidationError(
                    f"В проекте «{project.name}» уже существует активная задача с названием «{title}»."
                )
                
        return attrs