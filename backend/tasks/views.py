from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Project, Tag, Task
from .serializers import UserSerializer, ProjectSerializer, TagSerializer, TaskSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Отдаем пользователю только его активные проекты
        return Project.objects.filter(owner=self.request.user, is_deleted=False)

    def create(self, request, *args, **kwargs):
        name = request.data.get('name')
        
        # 1. Проверяем, существует ли активный проект с таким же именем у этого пользователя
        if Project.objects.filter(name=name, owner=request.user, is_deleted=False).exists():
            return Response(
                {"detail": "Проект с таким названием уже существует."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 2. Если проект с таким именем был ранее мягко удален — восстанавливаем его и его задачи
        deleted_project = Project.objects.filter(name=name, owner=request.user, is_deleted=True).first()
        if deleted_project:
            deleted_project.is_deleted = False
            deleted_project.save()
            
            # Каскадно восстанавливаем задачи этого проекта
            deleted_project.tasks.all().update(is_deleted=False)
            
            serializer = self.get_serializer(deleted_project)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # 3. Если проект новый — создаем стандартно
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(owner=self.request.user, is_deleted=False)

    def create(self, request, *args, **kwargs):
        name = request.data.get('name')
        
        if Tag.objects.filter(name=name, owner=request.user, is_deleted=False).exists():
            return Response(
                {"detail": "Тег с таким названием уже существует."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_tag = Tag.objects.filter(name=name, owner=request.user, is_deleted=True).first()
        if deleted_tag:
            deleted_tag.is_deleted = False
            deleted_tag.save()
            serializer = self.get_serializer(deleted_tag)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(assignee=self.request.user, is_deleted=False)
        
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(assignee=self.request.user)